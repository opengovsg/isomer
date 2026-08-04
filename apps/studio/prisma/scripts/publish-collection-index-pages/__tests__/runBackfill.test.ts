import { mkdtempSync, readFileSync, rmSync } from "fs"
import { isEqual } from "lodash-es"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createCollectionIndexJson } from "~/server/modules/collection/collection.service"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "~/server/modules/database"

import { resetTables } from "../../../../tests/integration/helpers/db"
import {
  setupCollection,
  setupPageResource,
  setupFolder,
  setupIsomerAdmin,
  setupSite,
  setupUser,
} from "../../../../tests/integration/helpers/seed"
import { findNeverPublishedCollectionIndexPages } from "../query"
import {
  publishNewBlobVersion,
  runBackfill,
  verifyIsomerAdminByEmail,
} from "../shared"

const SITE_A = 301
const SITE_B = 302
const AT = new Date("2026-08-04T12:00:00.000Z")

const CATEGORY = {
  label: "Category",
  id: "11111111-1111-4111-8111-111111111111",
  options: [{ label: "Speeches", id: "22222222-2222-4222-8222-222222222222" }],
}

let outDir: string
let publisherId: string

const collectionIndexBlob = (page: Record<string, unknown> = {}) => ({
  layout: "collection",
  page: {
    title: "Newsroom",
    subtitle:
      "Read up-to-date news articles, speeches, and press releases here.",
    sortOrder: "date-desc",
    ...page,
  },
  content: [],
  version: "0.1.0",
})

/** A Collection with a never-published IndexPage whose draft holds `blobContent`. */
const seedTarget = async ({
  siteId,
  permalink = "test-collection",
  title = "Newsroom",
  blobContent = collectionIndexBlob(),
}: {
  siteId: number
  permalink?: string
  title?: string
  /** Deliberately loose: these tests seed malformed drafts on purpose. */
  blobContent?: unknown
}) => {
  const { collection } = await setupCollection({ siteId, permalink, title })
  const draftBlob = await db
    .insertInto("Blob")
    .values({ content: jsonb(blobContent as PrismaJson.BlobJsonContent) })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexPage = await db
    .insertInto("Resource")
    .values({
      title,
      permalink: "_index",
      siteId,
      parentId: collection.id,
      draftBlobId: draftBlob.id,
      publishedVersionId: null,
      type: ResourceType.IndexPage,
      state: ResourceState.Draft,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { collection, indexPage, draftBlob }
}

const counts = async () => {
  const [blobs, versions] = await Promise.all([
    db
      .selectFrom("Blob")
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirstOrThrow(),
    db
      .selectFrom("Version")
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirstOrThrow(),
  ])
  return { blobs: Number(blobs.count), versions: Number(versions.count) }
}

const getResource = (id: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow()

const getBlob = (id: string) =>
  db
    .selectFrom("Blob")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirstOrThrow()

beforeEach(async () => {
  await resetTables(
    "Blob",
    "Resource",
    "Version",
    "Site",
    "User",
    "IsomerAdmin",
  )
  // setupCollection FETCHES the site when given a siteId, so it must exist first.
  await setupSite(SITE_A)
  await setupSite(SITE_B)
  outDir = mkdtempSync(join(tmpdir(), "publish-index-pages-"))
  publisherId = (await setupUser({ email: "publisher@test.gov.sg" })).id
})

afterEach(() => {
  rmSync(outDir, { recursive: true, force: true })
})

const apply = async (siteId?: number) =>
  runBackfill({ mode: "apply", siteId, publisherId, outDir, at: AT })

// ---------------------------------------------------------------------------
// Which rows the query selects — one case per WHERE clause. A wrong join here
// silently publishes the wrong rows, so each clause gets its own test.
// ---------------------------------------------------------------------------

describe("findNeverPublishedCollectionIndexPages", () => {
  it("selects a Collection's never-published IndexPage", async () => {
    const { indexPage } = await seedTarget({ siteId: SITE_A })
    const rows = await findNeverPublishedCollectionIndexPages()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.resourceId).toBe(indexPage.id)
  })

  it("excludes an IndexPage that already has a publishedVersionId", async () => {
    const { collection } = await setupCollection({ siteId: SITE_A })
    await setupPageResource({
      siteId: SITE_A,
      resourceType: ResourceType.IndexPage,
      parentId: collection.id,
      state: ResourceState.Published,
      userId: publisherId,
    })
    expect(await findNeverPublishedCollectionIndexPages()).toHaveLength(0)
  })

  it("excludes a Folder's IndexPage — the parent must be a Collection", async () => {
    const { folder } = await setupFolder({ siteId: SITE_A })
    await setupPageResource({
      siteId: SITE_A,
      resourceType: ResourceType.IndexPage,
      parentId: folder.id,
    })
    expect(await findNeverPublishedCollectionIndexPages()).toHaveLength(0)
  })

  it("excludes an IndexPage with a null parentId", async () => {
    await setupPageResource({
      siteId: SITE_A,
      resourceType: ResourceType.IndexPage,
      parentId: null,
    })
    expect(await findNeverPublishedCollectionIndexPages()).toHaveLength(0)
  })

  it("excludes non-IndexPage children of a Collection", async () => {
    const { collection } = await setupCollection({ siteId: SITE_A })
    await setupPageResource({
      siteId: SITE_A,
      resourceType: ResourceType.CollectionPage,
      parentId: collection.id,
    })
    expect(await findNeverPublishedCollectionIndexPages()).toHaveLength(0)
  })

  it("surfaces a row with a null draftBlobId rather than dropping it", async () => {
    const { collection } = await setupCollection({ siteId: SITE_A })
    await db
      .insertInto("Resource")
      .values({
        title: "Newsroom",
        permalink: "_index",
        siteId: SITE_A,
        parentId: collection.id,
        draftBlobId: null,
        publishedVersionId: null,
        type: ResourceType.IndexPage,
        state: ResourceState.Draft,
      })
      .execute()

    const rows = await findNeverPublishedCollectionIndexPages()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.draftContent).toBeNull()
  })

  it("honours the optional siteId filter", async () => {
    await seedTarget({ siteId: SITE_A, permalink: "a" })
    await seedTarget({ siteId: SITE_B, permalink: "b" })

    expect(await findNeverPublishedCollectionIndexPages()).toHaveLength(2)
    const scoped = await findNeverPublishedCollectionIndexPages({
      siteId: SITE_A,
    })
    expect(scoped).toHaveLength(1)
    expect(scoped[0]?.siteId).toBe(SITE_A)
  })
})

// ---------------------------------------------------------------------------
// The write
// ---------------------------------------------------------------------------

describe("runBackfill apply", () => {
  it("creates one Blob + one Version and points the Resource at them", async () => {
    const { indexPage } = await seedTarget({ siteId: SITE_A })
    const before = await counts()

    const { report } = await apply()

    const after = await counts()
    expect(after.blobs).toBe(before.blobs + 1)
    expect(after.versions).toBe(before.versions + 1)

    const published = report.publishedRows[0]
    const resource = await getResource(indexPage.id)
    expect(resource.publishedVersionId).toBe(published?.newVersionId)
    expect(resource.state).toBe(ResourceState.Published)

    const version = await db
      .selectFrom("Version")
      .where("id", "=", published!.newVersionId)
      .selectAll()
      .executeTakeFirstOrThrow()
    expect(version.versionNum).toBe(1)
    expect(version.publishedBy).toBe(publisherId)
    expect(version.blobId).toBe(published?.newBlobId)
  })

  it("leaves draftBlobId and the draft blob completely untouched", async () => {
    // The headline invariant: the draft survives, so in-progress editor work is
    // preserved and Studio still shows "unpublished changes".
    const { indexPage, draftBlob } = await seedTarget({
      siteId: SITE_A,
      blobContent: collectionIndexBlob({ subtitle: "Editor's own words" }),
    })

    await apply()

    expect((await getResource(indexPage.id)).draftBlobId).toBe(draftBlob.id)
    const draftAfter = await getBlob(draftBlob.id)
    expect(draftAfter.content).toEqual(draftBlob.content)
    expect(draftAfter.updatedAt).toEqual(draftBlob.updatedAt)
  })

  it("publishes the canonical template despite jsonb key reordering", async () => {
    // Postgres jsonb does not preserve key insertion order, so this comparison
    // must be order-insensitive. A JSON.stringify check would fail here.
    await seedTarget({ siteId: SITE_A })

    const { report } = await apply()

    const published = await getBlob(report.publishedRows[0]!.newBlobId)
    expect(
      isEqual(published.content, createCollectionIndexJson("Newsroom")),
    ).toBe(true)
  })

  it("carries tagCategories verbatim through the round trip", async () => {
    const decorated = { ...CATEGORY, display: "plaintext" as const }
    await seedTarget({
      siteId: SITE_A,
      blobContent: collectionIndexBlob({
        tagCategories: [CATEGORY, decorated],
      }),
    })

    const { report } = await apply()

    const published = await getBlob(report.publishedRows[0]!.newBlobId)
    const { page } = published.content as { page: Record<string, unknown> }
    expect(page.tagCategories).toStrictEqual([CATEGORY, decorated])
    const [first] = page.tagCategories as Record<string, unknown>[]
    expect(first && "display" in first).toBe(false)
  })

  it("publishes even when tagCategories is a malformed shape, copying it wholesale", async () => {
    await seedTarget({
      siteId: SITE_A,
      permalink: "odd-shape",
      blobContent: collectionIndexBlob({ tagCategories: "nope" }),
    })

    const { report } = await apply()

    expect(report.totals).toMatchObject({
      eligible: 1,
      toPublish: 1,
      skipped: 0,
      published: 1,
    })
    const published = await getBlob(report.publishedRows[0]!.newBlobId)
    const { page } = published.content as { page: Record<string, unknown> }
    expect(page.tagCategories).toBe("nope")
  })

  it("is idempotent — a second run finds nothing", async () => {
    await seedTarget({ siteId: SITE_A })
    await apply()
    const after1 = await counts()

    const { report } = await apply()

    expect(report.totals.eligible).toBe(0)
    expect(report.publishedRows).toHaveLength(0)
    expect(await counts()).toEqual(after1)
  })

  it("refuses to publish twice over the same resource", async () => {
    const { indexPage } = await seedTarget({ siteId: SITE_A })
    const args = {
      resourceId: indexPage.id,
      siteId: SITE_A,
      content: createCollectionIndexJson("Newsroom"),
      publisherId,
    }

    const first = await db
      .transaction()
      .execute((tx) => publishNewBlobVersion(tx, args))
    expect("skipped" in first).toBe(false)

    const before = await counts()
    const second = await db
      .transaction()
      .execute((tx) => publishNewBlobVersion(tx, args))

    expect(second).toEqual({ skipped: true })
    expect(await counts()).toEqual(before)
  })

  it("publishes only the requested site", async () => {
    const a = await seedTarget({ siteId: SITE_A, permalink: "a" })
    const b = await seedTarget({ siteId: SITE_B, permalink: "b" })

    await apply(SITE_A)

    expect(
      (await getResource(a.indexPage.id)).publishedVersionId,
    ).not.toBeNull()
    expect((await getResource(b.indexPage.id)).publishedVersionId).toBeNull()
  })
})

describe("runBackfill dry-run", () => {
  it("writes nothing to the database", async () => {
    const { indexPage, draftBlob } = await seedTarget({ siteId: SITE_A })
    const before = await counts()

    const { report } = await runBackfill({ mode: "dry-run", outDir, at: AT })

    expect(report.totals).toMatchObject({ toPublish: 1, published: 0 })
    expect(await counts()).toEqual(before)

    const resource = await getResource(indexPage.id)
    expect(resource.publishedVersionId).toBeNull()
    expect(resource.state).toBe(ResourceState.Draft)
    expect((await getBlob(draftBlob.id)).updatedAt).toEqual(draftBlob.updatedAt)
  })

  it("rejects apply without a publisherId", async () => {
    await expect(
      runBackfill({ mode: "apply", outDir, at: AT }),
    ).rejects.toThrow(/requires a publisherId/)
  })

  it("counts the blog-variant rows that will flip to 1-column", async () => {
    await seedTarget({
      siteId: SITE_A,
      permalink: "blog",
      blobContent: collectionIndexBlob({ variant: "blog" }),
    })
    await seedTarget({ siteId: SITE_A, permalink: "plain" })

    const { report } = await runBackfill({ mode: "dry-run", outDir, at: AT })

    expect(report.variantFlipCount).toBe(1)
  })

  it("writes a scope-named report holding the rollback data", async () => {
    await seedTarget({ siteId: SITE_A })

    const { path } = await apply(SITE_A)

    expect(path).toContain(`site-${SITE_A}`)
    expect(path).toContain("2026-08-04T12-00-00-000Z")
    const written = JSON.parse(readFileSync(path, "utf-8")) as {
      mode: string
      scope: string
      publishedRows: { previousState: string }[]
    }
    expect(written.mode).toBe("apply")
    expect(written.scope).toBe(`site-${SITE_A}`)
    expect(written.publishedRows[0]?.previousState).toBe(ResourceState.Draft)
  })

  it("keeps publishedRows on disk if a later batch fails", async () => {
    const first = await seedTarget({ siteId: SITE_A, permalink: "first" })
    const second = await seedTarget({ siteId: SITE_A, permalink: "second" })
    const path = join(
      outDir,
      `2026-08-04T12-00-00-000Z-site-${SITE_A}.report.json`,
    )

    await expect(
      runBackfill({
        mode: "apply",
        siteId: SITE_A,
        publisherId,
        outDir,
        at: AT,
        batchSize: 1,
        onAfterBatch: async (batchIndex) => {
          if (batchIndex !== 0) return
          const flushed = JSON.parse(readFileSync(path, "utf-8")) as {
            publishedRows: { resourceId: string }[]
          }
          const publishedId = flushed.publishedRows[0]?.resourceId
          const remaining = [first, second].find(
            (seed) => seed.indexPage.id !== publishedId,
          )
          await db
            .deleteFrom("Resource")
            .where("id", "=", remaining!.indexPage.id)
            .execute()
        },
      }),
    ).rejects.toThrow(/not found/)

    const written = JSON.parse(readFileSync(path, "utf-8")) as {
      publishedRows: { resourceId: string }[]
    }
    expect(written.publishedRows).toHaveLength(1)
    expect(
      (await getResource(written.publishedRows[0]!.resourceId))
        .publishedVersionId,
    ).not.toBeNull()
  })
})

describe("verifyIsomerAdminByEmail", () => {
  it("accepts an active IsomerAdmin", async () => {
    const user = await setupUser({ email: "admin@open.gov.sg" })
    await setupIsomerAdmin({ userId: user.id })

    await expect(
      verifyIsomerAdminByEmail("Admin@Open.gov.sg"),
    ).resolves.toMatchObject({
      id: user.id,
      email: "admin@open.gov.sg",
    })
  })

  it("rejects a user who is not an IsomerAdmin", async () => {
    await setupUser({ email: "editor@agency.gov.sg" })

    await expect(
      verifyIsomerAdminByEmail("editor@agency.gov.sg"),
    ).rejects.toThrow(/not an active IsomerAdmin/)
  })

  it("rejects an expired IsomerAdmin", async () => {
    const user = await setupUser({ email: "expired@open.gov.sg" })
    await setupIsomerAdmin({
      userId: user.id,
      expiry: new Date("2020-01-01T00:00:00.000Z"),
    })

    await expect(
      verifyIsomerAdminByEmail("expired@open.gov.sg"),
    ).rejects.toThrow(/not an active IsomerAdmin/)
  })

  it("rejects an unknown email", async () => {
    await expect(
      verifyIsomerAdminByEmail("missing@open.gov.sg"),
    ).rejects.toThrow(/not found/)
  })
})
