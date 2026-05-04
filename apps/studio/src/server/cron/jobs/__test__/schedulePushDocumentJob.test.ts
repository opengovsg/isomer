import type { User } from "@prisma/client"
import { ResourceType } from "@prisma/client"
import { addMinutes } from "date-fns"
import MockDate from "mockdate"
import { resetTables } from "tests/integration/helpers/db"
import { applyAuthedSession } from "tests/integration/helpers/iron-session"
import { setupPageResource, setupUser } from "tests/integration/helpers/seed"
import * as s3Lib from "~/lib/s3"
import * as assetService from "~/server/modules/asset/asset.service"
import { db } from "~server/db"

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
) => {
  await db
    .updateTable("Blob")
    .set({ content: { page: { ref, category, tagged } } as never })
    .where("id", "=", String(blobId))
    .execute()
}

const seedDocumentReadyForIngestion = async ({
  parentTitle,
  ref,
  publishedBy,
}: {
  parentTitle: string
  ref: string
  category: string
  publishedBy: string
}) => {
  // Parent (a folder/collection-like resource) — its title becomes the
  // SearchSG `categories[0]`.
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

  // A published Version for the IndexPage.
  await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId: indexPage.id,
      blobId: indexBlob.id,
      publishedBy,
    })
    .execute()

  // Child page that points at the PDF asset.
  const { page: child, blob } = await setupPageResource({
    resourceType: ResourceType.Page,
    siteId: site.id,
    parentId: parent.id,
    title: "Document Title",
    permalink: "document-title",
  })

  // Use parentTitle for page.category since the handler derives `categories`
  // from page.category (not from the parent resource's title).
  await setBlobContentForPushDocument(blob.id, ref, parentTitle, ["tag-1"])

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

describe("schedulePushDocumentJobHandler", async () => {
  const session = await applyAuthedSession()
  let user: User

  beforeEach(async () => {
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
    vi.spyOn(assetService, "parseFullTextFromPDF").mockResolvedValue(
      "parsed pdf text",
    )

    // Two sequential fetches: auth token, then ingest POST.
    vi.spyOn(global, "fetch").mockImplementation(
      // eslint-disable-next-line @typescript-eslint/require-await
      (async (input: Parameters<typeof fetch>[0]) => {
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
      }) as typeof fetch,
    )
  })

  afterEach(() => {
    MockDate.reset()
  })

  it("dispatches a row whose scheduledAt has passed and deletes it", async () => {
    const { resourceId } = await seedDocumentReadyForIngestion({
      parentTitle: "Notices",
      ref: "/some-bucket-key/file.pdf",
      category: "Public",
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

    await schedulePushDocumentJobHandler()

    // SearchSG was called with a payload that includes our resource.
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
      contentType: "Informational",
      customFilter1: ["Public"],
      categories: ["Notices"],
    })

    // Row was cleaned up.
    const remaining = await db
      .selectFrom("PushDocumentJob")
      .selectAll()
      .execute()
    expect(remaining).toHaveLength(0)

    // S3 + PDF parser were each invoked exactly once.
    expect(s3Lib.getBlob).toHaveBeenCalledTimes(1)
    expect(assetService.parseFullTextFromPDF).toHaveBeenCalledTimes(1)
  })

  it("skips rows scheduled for the future", async () => {
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

    await schedulePushDocumentJobHandler()

    // No SearchSG call (not even the auth-token fetch — the handler
    // returns early when there are no documents).
    expect(global.fetch).not.toHaveBeenCalled()

    // Row remains for the next tick.
    const remaining = await db
      .selectFrom("PushDocumentJob")
      .selectAll()
      .execute()
    expect(remaining).toHaveLength(1)
  })

  it("logs and skips a row whose blob content does not match the expected shape", async () => {
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

    await schedulePushDocumentJobHandler()

    // Auth + ingest skipped (no valid documents to push).
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
