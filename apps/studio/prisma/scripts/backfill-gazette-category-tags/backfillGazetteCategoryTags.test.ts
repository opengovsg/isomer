import { resetTables } from "tests/integration/helpers/db"
import {
  setupCollection,
  setupCollectionLink,
  setupPageResource,
  setupUser,
} from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it } from "vitest"
import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
} from "~/features/gazettes/constants"
import { db } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { backfillGazetteCategoryTags } from "./backfillGazetteCategoryTags"

const CAT_GOV = "cat-gov"
const CAT_LEG = "cat-leg"
const SUB_ADV = "sub-adv"
const SUB_ACTS = "sub-acts"

const TAG_CATEGORIES = [
  {
    label: GAZETTE_CATEGORY_LABEL,
    options: [
      { id: CAT_GOV, label: "Government Gazette" },
      { id: CAT_LEG, label: "Legislative Supplements" },
    ],
  },
  {
    label: GAZETTE_SUBCATEGORY_LABEL,
    options: [
      { id: SUB_ADV, label: "Advertisements" },
      { id: SUB_ACTS, label: "Acts Supplement" },
    ],
  },
]

const setBlobPage = async (blobId: string, page: Record<string, unknown>) => {
  await db
    .updateTable("Blob")
    .set({
      content: {
        layout: "link",
        page,
        content: [],
        version: "0.1.0",
      } as never,
    })
    .where("id", "=", blobId)
    .execute()
}

const readPage = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .leftJoin("Blob as DraftBlob", "DraftBlob.id", "Resource.draftBlobId")
    .leftJoin("Version", "Version.id", "Resource.publishedVersionId")
    .leftJoin("Blob as PublishedBlob", "PublishedBlob.id", "Version.blobId")
    .where("Resource.id", "=", resourceId)
    .select((eb) =>
      eb.fn
        .coalesce("DraftBlob.content", "PublishedBlob.content")
        .as("content"),
    )
    .executeTakeFirstOrThrow()

  return (row.content as { page: Record<string, unknown> }).page
}

describe("backfillGazetteCategoryTags", () => {
  beforeEach(async () => {
    await resetTables(
      "PushDocumentJob",
      "AuditLog",
      "ResourcePermission",
      "Version",
      "Blob",
      "Resource",
      "Site",
      "IsomerAdmin",
      "User",
    )
  })

  const seed = async () => {
    const user = await setupUser({ email: "seed@example.com" })
    const { site, collection } = await setupCollection({
      permalink: "gazettes",
    })

    // IndexPage carries the taxonomy. Published only, no draft.
    const { blob: indexBlob } = await setupPageResource({
      resourceType: ResourceType.IndexPage,
      siteId: site.id,
      parentId: collection.id,
      title: "Index",
      permalink: "index",
      state: ResourceState.Published,
      userId: user.id,
    })
    await db
      .updateTable("Blob")
      .set({
        content: {
          layout: "collection",
          page: { tagCategories: TAG_CATEGORIES },
          content: [],
          version: "0.1.0",
        } as never,
      })
      .where("id", "=", String(indexBlob.id))
      .execute()

    // (a) legacy draft — subcategory only, with extra keys that must survive.
    const legacyDraft = await setupCollectionLink({
      siteId: site.id,
      collectionId: collection.id,
      permalink: "a",
      title: "Legacy draft",
    })
    await setBlobPage(String(legacyDraft.blob.id), {
      ref: "/2026/Government Gazette/Advertisements/a.pdf",
      date: "01/01/2026",
      description: "111",
      category: "Government Gazette",
      summary: "keep me",
      tagged: [SUB_ADV],
    })

    // (b) already migrated — must not change.
    const migrated = await setupCollectionLink({
      siteId: site.id,
      collectionId: collection.id,
      permalink: "b",
      title: "Already migrated",
    })
    await setBlobPage(String(migrated.blob.id), {
      ref: "/2026/Government Gazette/Advertisements/b.pdf",
      tagged: [CAT_GOV, SUB_ADV],
    })

    // (c) unresolvable — nothing to derive from.
    const unresolvable = await setupCollectionLink({
      siteId: site.id,
      collectionId: collection.id,
      permalink: "c",
      title: "Unresolvable",
    })
    await setBlobPage(String(unresolvable.blob.id), {
      ref: "/2026/Government Gazette/Advertisements/c.pdf",
      tagged: [],
    })

    // (d) legacy on the PUBLISHED side, different category to prove routing.
    const legacyPublished = await setupCollectionLink({
      siteId: site.id,
      collectionId: collection.id,
      permalink: "d",
      title: "Legacy published",
      state: ResourceState.Published,
      userId: user.id,
    })
    await setBlobPage(String(legacyPublished.blob.id), {
      ref: "/2026/Legislative Supplements/Acts Supplement/d.pdf",
      tagged: [SUB_ACTS],
    })

    // (e) a gazette in a DIFFERENT collection — must be left alone.
    const { collection: otherCollection } = await setupCollection({
      siteId: site.id,
      permalink: "other",
    })
    const outOfScope = await setupCollectionLink({
      siteId: site.id,
      collectionId: otherCollection.id,
      permalink: "e",
      title: "Out of scope",
    })
    await setBlobPage(String(outOfScope.blob.id), {
      ref: "/2026/Government Gazette/Advertisements/e.pdf",
      tagged: [SUB_ADV],
    })

    return {
      siteId: site.id,
      collectionId: Number(collection.id),
      legacyDraft,
      migrated,
      unresolvable,
      legacyPublished,
      outOfScope,
    }
  }

  it("reports without writing on a dry run", async () => {
    const { siteId, collectionId, legacyDraft } = await seed()

    const unresolvedCount = await backfillGazetteCategoryTags({
      siteId,
      collectionId,
      dryRun: true,
    })

    expect(unresolvedCount).toBe(1)
    expect((await readPage(legacyDraft.collectionLink.id)).tagged).toEqual([
      SUB_ADV,
    ])
  })

  it("backfills draft and published sides, routing each to its own category", async () => {
    const { siteId, collectionId, legacyDraft, legacyPublished } = await seed()

    await backfillGazetteCategoryTags({ siteId, collectionId, dryRun: false })

    expect((await readPage(legacyDraft.collectionLink.id)).tagged).toEqual([
      CAT_GOV,
      SUB_ADV,
    ])
    expect((await readPage(legacyPublished.collectionLink.id)).tagged).toEqual([
      CAT_LEG,
      SUB_ACTS,
    ])
  })

  it("preserves every other page key, including the legacy category", async () => {
    const { siteId, collectionId, legacyDraft } = await seed()

    await backfillGazetteCategoryTags({ siteId, collectionId, dryRun: false })

    expect(await readPage(legacyDraft.collectionLink.id)).toMatchObject({
      ref: "/2026/Government Gazette/Advertisements/a.pdf",
      date: "01/01/2026",
      description: "111",
      category: "Government Gazette",
      summary: "keep me",
    })
  })

  it("leaves already-migrated and unresolvable rows untouched", async () => {
    const { siteId, collectionId, migrated, unresolvable } = await seed()

    await backfillGazetteCategoryTags({ siteId, collectionId, dryRun: false })

    expect((await readPage(migrated.collectionLink.id)).tagged).toEqual([
      CAT_GOV,
      SUB_ADV,
    ])
    expect((await readPage(unresolvable.collectionLink.id)).tagged).toEqual([])
  })

  it("does not touch gazettes in another collection", async () => {
    const { siteId, collectionId, outOfScope } = await seed()

    await backfillGazetteCategoryTags({ siteId, collectionId, dryRun: false })

    expect((await readPage(outOfScope.collectionLink.id)).tagged).toEqual([
      SUB_ADV,
    ])
  })

  it("is idempotent — a second run changes nothing", async () => {
    const { siteId, collectionId, legacyDraft } = await seed()

    await backfillGazetteCategoryTags({ siteId, collectionId, dryRun: false })
    const afterFirst = await readPage(legacyDraft.collectionLink.id)

    await backfillGazetteCategoryTags({ siteId, collectionId, dryRun: false })

    expect(await readPage(legacyDraft.collectionLink.id)).toEqual(afterFirst)
  })

  it("throws when the collection has no Category tagCategory", async () => {
    const { siteId, collectionId } = await seed()

    const indexPage = await db
      .selectFrom("Resource")
      .innerJoin("Version", "Version.id", "Resource.publishedVersionId")
      .where("Resource.parentId", "=", String(collectionId))
      .where("Resource.type", "=", ResourceType.IndexPage)
      .select("Version.blobId")
      .executeTakeFirstOrThrow()

    await db
      .updateTable("Blob")
      .set({
        content: {
          layout: "collection",
          // Lowercased label: the app matches exactly, so this must be treated
          // as "no Category group" rather than silently accepted.
          page: {
            tagCategories: [{ label: "category", options: [] }],
          },
          content: [],
          version: "0.1.0",
        } as never,
      })
      .where("id", "=", indexPage.blobId)
      .execute()

    await expect(
      backfillGazetteCategoryTags({ siteId, collectionId, dryRun: true }),
    ).rejects.toThrow(/no "Category" tagCategory options/)
  })
})
