import type * as serverContextType from "~/server/context"
import type { User } from "~prisma/generated/selectableTypes"
import { addMinutes } from "date-fns"
import MockDate from "mockdate"
import { resetTables } from "tests/integration/helpers/db"
import { applyAuthedSession } from "tests/integration/helpers/iron-session"
import { setupPageResource, setupUser } from "tests/integration/helpers/seed"
import * as s3Lib from "~/lib/s3"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { db } from "~server/db"

import * as algoliaPkg from "@isomer/algolia"

// algolia.ts constructs the Algolia client at module load via
// algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_API_KEY). Those env vars are
// not set in the test environment, so the import throws "appId is missing"
// before any test runs. Mock the whole module to prevent this.
vi.mock("~/lib/algolia")

// Mock createGrowthBookContext so tests can control the flag without hitting
// the remote GrowthBook CDN.
vi.mock("~/server/context", async (importOriginal) => {
  const actual = await importOriginal<typeof serverContextType>()
  return {
    ...actual,
    createGrowthBookContext: vi.fn(),
  }
})

import * as algoliaLib from "~/lib/algolia"
import * as serverContext from "~/server/context"

import { schedulePushDocumentJobHandler } from "../schedulePushDocumentJob"

const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")

// fetch's first argument can be string | URL | Request; URL has a
// well-defined toString, but Request needs a property pull.
const urlToString = (input: Parameters<typeof fetch>[0]): string =>
  typeof input === "string"
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url

// Replace the document blob's content with a shape the worker accepts.
// The worker's Zod parse inspects `page.ref`, `page.category`, and
// `page.tagged`, so we cast around the broader BlobJsonContent typing for
// the sake of the fixture.
const setBlobContentForPushDocument = async (
  blobId: bigint | string,
  ref: string,
  category: string,
  tagged: string[] = [],
  description?: string,
) => {
  await db
    .updateTable("Blob")
    .set({
      content: { page: { ref, category, tagged, description } } as never,
    })
    .where("id", "=", String(blobId))
    .execute()
}

const seedDocumentReadyForIngestion = async ({
  parentTitle,
  ref,
  category,
  publishedBy,
  description,
}: {
  parentTitle: string
  ref: string
  category: string
  publishedBy: string
  description?: string
}) => {
  const { page: parent, site } = await setupPageResource({
    resourceType: ResourceType.Folder,
    title: parentTitle,
    permalink: parentTitle.toLowerCase().replace(/\s+/g, "-"),
  })

  // IndexPage resource — the handler queries for this to derive subcategory.
  const { page: indexPage, blob: indexBlob } = await setupPageResource({
    resourceType: ResourceType.IndexPage,
    siteId: site.id,
    parentId: parent.id,
    title: "Index",
    permalink: "index",
  })

  // Set the IndexPage blob content to the expected shape.
  await db
    .updateTable("Blob")
    .set({
      content: {
        layout: "collection",
        page: {
          tagCategories: [
            {
              options: [{ id: "tag-1", label: "Public" }],
            },
          ],
        },
      } as never,
    })
    .where("id", "=", String(indexBlob.id))
    .execute()

  // A published Version for the IndexPage. Publishing sets
  // publishedVersionId on the Resource (see version.service.ts), and the
  // handler resolves the index page blob through it.
  const indexVersion = await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId: indexPage.id,
      blobId: indexBlob.id,
      publishedBy,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  await db
    .updateTable("Resource")
    .set({ publishedVersionId: indexVersion.id })
    .where("id", "=", indexPage.id)
    .execute()

  // Child page that points at the PDF asset.
  const { page: child, blob } = await setupPageResource({
    resourceType: ResourceType.Page,
    siteId: site.id,
    parentId: parent.id,
    title: "Document Title",
    permalink: "document-title",
  })

  await setBlobContentForPushDocument(
    blob.id,
    ref,
    category,
    ["tag-1"],
    description,
  )

  // A published Version pointing at the same blob — the dispatcher reads
  // the latest Version per resource.
  await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId: child.id,
      blobId: blob.id,
      publishedBy,
    })
    .execute()

  return { resourceId: child.id, parentTitle, ref }
}

/** Build a mock GrowthBook instance where isOn returns the given value. */
const makeMockGb = (isOn: boolean) => ({
  isOn: vi.fn().mockReturnValue(isOn),
  destroy: vi.fn(),
})

describe("schedulePushDocumentJobHandler", async () => {
  const session = await applyAuthedSession()
  let user: User

  beforeEach(async () => {
    // clearAllMocks resets call counts / return-value overrides on the
    // module-level vi.mock("~/lib/algolia") auto-mock (which restoreAllMocks
    // would destroy, breaking vi.mocked(algoliaLib.*) calls below).
    // restoreAllMocks then cleans up the vi.spyOn stubs re-registered each
    // tick so they don't bleed across tests.
    vi.clearAllMocks()
    vi.restoreAllMocks()
    MockDate.set(FIXED_NOW)
    await resetTables(
      "PushDocumentJob",
      "AuditLog",
      "ResourcePermission",
      "Version",
      "Blob",
      "Resource",
      "Site",
      "User",
    )
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
      isDeleted: false,
    })

    // Stub heavy I/O so unit-style runs don't touch S3 or hit the
    // SearchSG endpoint.
    vi.spyOn(s3Lib, "getBlob").mockResolvedValue(new Uint8Array([1, 2, 3]))
    vi.spyOn(s3Lib, "setAssetAsPublished").mockResolvedValue(undefined)
    vi.spyOn(algoliaPkg, "parseFullTextFromPDF").mockResolvedValue(
      "parsed pdf text",
    )

    // Default: flag OFF → Algolia path.
    vi.mocked(serverContext.createGrowthBookContext).mockResolvedValue(
      makeMockGb(false) as never,
    )

    // Mock saveObjectsToSearchIndex (auto-mocked by vi.mock("~/lib/algolia")).
    vi.mocked(algoliaLib.saveObjectsToSearchIndex).mockResolvedValue(undefined)

    // Two sequential fetches: auth token, then ingest POST.
    vi.spyOn(global, "fetch").mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      async (input: Parameters<typeof fetch>[0]) => {
        const u = urlToString(input)
        if (u.endsWith("/v1/auth/token")) {
          return new Response(
            JSON.stringify({ accessToken: "test-token", tokenType: "Bearer" }),
            { status: 200 },
          )
        }
        if (u.includes("/documents")) {
          return new Response("{}", { status: 200 })
        }
        throw new Error(`Unexpected fetch: ${u}`)
      },
    )
  })

  afterEach(() => {
    MockDate.reset()
  })

  describe("Algolia path (flag OFF)", () => {
    it("dispatches a due row to Algolia and deletes it", async () => {
      // Arrange
      const { resourceId, ref } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/some-bucket-key/file.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — Algolia saveObjects was called with correct fields.
      expect(algoliaLib.saveObjectsToSearchIndex).toHaveBeenCalledTimes(1)
      const [records] = vi.mocked(algoliaLib.saveObjectsToSearchIndex).mock
        .calls[0]!
      expect(records.length).toBeGreaterThan(0)
      // objectGroup is the S3 key WITHOUT the leading slash.
      const expectedObjectGroup = ref.slice(1) // "some-bucket-key/file.pdf"
      expect(records[0]).toMatchObject({
        objectGroup: expectedObjectGroup,
        objectID: `${expectedObjectGroup}-text-0`,
        title: "Document Title",
        category: "Government Gazettes",
        subCategory: "Public",
      })
      // fileUrl is the public URL (with scheme + domain).
      expect(records[0]!.fileUrl).toMatch(/^https:\/\//)
      expect(records[0]!.fileUrl).toContain(ref)

      // SearchSG was NOT called.
      expect(global.fetch).not.toHaveBeenCalled()

      // Row was cleaned up.
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(0)

      // S3 + PDF parser were each invoked exactly once.
      expect(s3Lib.getBlob).toHaveBeenCalledTimes(1)
      expect(algoliaPkg.parseFullTextFromPDF).toHaveBeenCalledTimes(1)
    })

    it("passes the full PDF text to Algolia without truncating to 50k", async () => {
      // Arrange
      // Build text longer than the 50k SearchSG truncation limit, using
      // whitespace-delimited words so the 7 000-char chunk regex can split it
      // into multiple records (a run with no whitespace produces only 1 record).
      const word = "gazette " // 8 chars including trailing space
      const longText = word.repeat(8000) // 64 000 chars, > 50 000
      vi.spyOn(algoliaPkg, "parseFullTextFromPDF").mockResolvedValue(longText)
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/2024/gazette/public/long.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Spy on buildGazetteSearchRecords to capture its typed SearchRecord[]
      // return value — text is string there, so no unsafe cast is needed.
      const buildSpy = vi.spyOn(algoliaPkg, "buildGazetteSearchRecords")

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — records were built from the full text (>1 chunk because the
      // text exceeds one 7 000-char chunk), and no 50k truncation was applied.
      expect(algoliaLib.saveObjectsToSearchIndex).toHaveBeenCalledTimes(1)
      const builtRecords: algoliaPkg.SearchRecord[] =
        buildSpy.mock.results[0]!.value
      expect(builtRecords.length).toBeGreaterThan(1)
      // The combined text length across all chunks equals the full text, not
      // the 50 000-char truncated version.
      const combinedLength = builtRecords.reduce(
        (acc, r) => acc + r.text.length,
        0,
      )
      expect(combinedLength).toBe(longText.length)
      expect(combinedLength).toBeGreaterThan(50000)
    })

    it("passes notification number when description is present", async () => {
      // Arrange
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/2024/gazette/public/notif.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
        description: "12345",
      })
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert
      expect(algoliaLib.saveObjectsToSearchIndex).toHaveBeenCalledTimes(1)
      const [records] = vi.mocked(algoliaLib.saveObjectsToSearchIndex).mock
        .calls[0]!
      expect(records[0]).toMatchObject({ notificationNum: "12345" })
    })

    it("skips save when PDF text is empty (no records built)", async () => {
      // Arrange
      vi.spyOn(algoliaPkg, "parseFullTextFromPDF").mockResolvedValue("")
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/empty/gazette.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — saveObjects not called, but job row still deleted.
      expect(algoliaLib.saveObjectsToSearchIndex).not.toHaveBeenCalled()
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(0)
    })

    it("isolates failures: one bad resource does not prevent others from being saved", async () => {
      // Arrange
      const { resourceId: goodId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/good/gazette.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      const { resourceId: badId, ref: badRef } =
        await seedDocumentReadyForIngestion({
          parentTitle: "Notices2",
          ref: "/bad/gazette.pdf",
          category: "Government Gazettes",
          publishedBy: user.id,
        })

      await db
        .insertInto("PushDocumentJob")
        .values([
          {
            resourceId: String(goodId),
            scheduledAt: FIXED_NOW,
            scheduledBy: user.id,
          },
          {
            resourceId: String(badId),
            scheduledAt: FIXED_NOW,
            scheduledBy: user.id,
          },
        ])
        .execute()

      // Make saveObjectsToSearchIndex throw for the bad resource's objectGroup.
      vi.mocked(algoliaLib.saveObjectsToSearchIndex).mockImplementation(
        (records) => {
          if (
            records[0] &&
            (records[0] as unknown as { objectGroup: string }).objectGroup ===
              badRef.slice(1)
          ) {
            throw new Error("Algolia error")
          }
          return Promise.resolve()
        },
      )

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — saveObjects was called twice (once per resource).
      expect(algoliaLib.saveObjectsToSearchIndex).toHaveBeenCalledTimes(2)
      // Both rows cleaned up regardless.
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(0)
    })

    it("dispatches a resource that was already published (publishing cron won the race)", async () => {
      // Arrange — simulate the schedule-publishing cron having already run
      // for this gazette: publishing promotes the draft blob into the
      // published Version and clears draftBlobId (see publishPageResource /
      // version.service.ts). Both crons fire on the same scheduledAt, so
      // this ordering happens whenever schedule-publishing wins the tick.
      const { resourceId, ref } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/2024/gazette/public/published-first.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      const version = await db
        .selectFrom("Version")
        .where("resourceId", "=", String(resourceId))
        .select("id")
        .executeTakeFirstOrThrow()
      await db
        .updateTable("Resource")
        .set({ publishedVersionId: version.id, draftBlobId: null })
        .where("id", "=", String(resourceId))
        .execute()
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — the gazette is indexed from the published Version's blob
      // and its S3 object is untagged, even though no draft blob remains.
      expect(algoliaLib.saveObjectsToSearchIndex).toHaveBeenCalledTimes(1)
      const [records] = vi.mocked(algoliaLib.saveObjectsToSearchIndex).mock
        .calls[0]!
      expect(records[0]).toMatchObject({ objectGroup: ref.slice(1) })
      expect(s3Lib.setAssetAsPublished).toHaveBeenCalledTimes(1)
      const remainingAfterPublish = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remainingAfterPublish).toHaveLength(0)
    })

    it("indexes the published version's content, not a newer unpublished draft", async () => {
      // Arrange — publish the gazette, then attach a NEW draft blob whose
      // ref differs. The job must index what actually went live, not
      // unpublished edits.
      const publishedRef = "/2024/gazette/public/live.pdf"
      const draftRef = "/2024/gazette/public/edited-draft.pdf"
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: publishedRef,
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      const version = await db
        .selectFrom("Version")
        .where("resourceId", "=", String(resourceId))
        .select("id")
        .executeTakeFirstOrThrow()
      const draftBlob = await db
        .insertInto("Blob")
        .values({ content: {} as never })
        .returning("id")
        .executeTakeFirstOrThrow()
      await setBlobContentForPushDocument(
        draftBlob.id,
        draftRef,
        "Government Gazettes",
        ["tag-1"],
      )
      await db
        .updateTable("Resource")
        .set({ publishedVersionId: version.id, draftBlobId: draftBlob.id })
        .where("id", "=", String(resourceId))
        .execute()
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — records are built from the published ref, not the draft's.
      expect(algoliaLib.saveObjectsToSearchIndex).toHaveBeenCalledTimes(1)
      const [records] = vi.mocked(algoliaLib.saveObjectsToSearchIndex).mock
        .calls[0]!
      expect(records[0]).toMatchObject({
        objectGroup: publishedRef.slice(1),
      })
    })

    it("skips rows scheduled for the future", async () => {
      // Arrange
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/some-bucket-key/future.pdf",
        category: "Public",
        publishedBy: user.id,
      })
      const futureAt = addMinutes(FIXED_NOW, 30)
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: futureAt,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — neither Algolia nor SearchSG called.
      expect(algoliaLib.saveObjectsToSearchIndex).not.toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()

      // Row remains for the next tick.
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(1)
    })

    it("logs and skips a row whose blob content does not match the expected shape", async () => {
      // Arrange
      const { page: parent, site } = await setupPageResource({
        resourceType: ResourceType.Folder,
        title: "Notices",
        permalink: "notices",
      })
      const { page: child } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
        parentId: parent.id,
        title: "Bad Document",
        permalink: "bad-document",
      })
      // Default setupBlob content has no `page.ref`/`page.category`, so
      // the worker's Zod check should reject it.
      const { id: blobId } = await db
        .selectFrom("Resource")
        .where("id", "=", child.id)
        .select("draftBlobId")
        .executeTakeFirstOrThrow()
        .then((r) => ({ id: r.draftBlobId! }))
      await db
        .insertInto("Version")
        .values({
          versionNum: 1,
          resourceId: child.id,
          blobId,
          publishedBy: user.id,
        })
        .execute()

      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(child.id),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — Algolia and SearchSG both skipped (no valid documents).
      expect(algoliaLib.saveObjectsToSearchIndex).not.toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
      // Row still cleaned up — the worker treats malformed content as a
      // permanent failure for that row, not a transient error.
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(0)
    })
  })

  describe("SearchSG path (flag ON)", () => {
    beforeEach(() => {
      // Switch the GrowthBook mock to flag=ON for this suite.
      vi.mocked(serverContext.createGrowthBookContext).mockResolvedValue(
        makeMockGb(true) as never,
      )
    })

    it("dispatches a row whose scheduledAt has passed to SearchSG and deletes it", async () => {
      // Arrange
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/some-bucket-key/file.pdf",
        category: "Government Gazettes",
        publishedBy: user.id,
      })
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — SearchSG was called with a payload that includes our resource.
      const ingestCall = vi
        .mocked(global.fetch)
        .mock.calls.find(([u]) => urlToString(u).includes("/documents"))
      expect(ingestCall).toBeDefined()
      const ingestBody = ingestCall![1]?.body as string
      const body = JSON.parse(ingestBody) as {
        documentsToAdd: Record<string, unknown>[]
      }
      expect(body.documentsToAdd).toHaveLength(1)
      expect(body.documentsToAdd[0]).toMatchObject({
        title: "Document Title",
        content: "parsed pdf text",
        contentType: "Government Gazettes",
        categories: ["Public"],
      })

      // Algolia was NOT called.
      expect(algoliaLib.saveObjectsToSearchIndex).not.toHaveBeenCalled()

      // Row was cleaned up.
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(0)

      // S3 + PDF parser were each invoked exactly once.
      expect(s3Lib.getBlob).toHaveBeenCalledTimes(1)
      expect(algoliaPkg.parseFullTextFromPDF).toHaveBeenCalledTimes(1)
    })

    it("skips rows scheduled for the future", async () => {
      // Arrange
      const { resourceId } = await seedDocumentReadyForIngestion({
        parentTitle: "Notices",
        ref: "/some-bucket-key/future.pdf",
        category: "Public",
        publishedBy: user.id,
      })
      const futureAt = addMinutes(FIXED_NOW, 30)
      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(resourceId),
          scheduledAt: futureAt,
          scheduledBy: user.id,
        })
        .execute()

      // Act
      await schedulePushDocumentJobHandler()

      // Assert — No SearchSG call (not even the auth-token fetch — the handler
      // returns early when there are no documents).
      expect(global.fetch).not.toHaveBeenCalled()

      // Row remains for the next tick.
      const remaining = await db
        .selectFrom("PushDocumentJob")
        .selectAll()
        .execute()
      expect(remaining).toHaveLength(1)
    })
  })
})
