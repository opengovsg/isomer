import crypto from "crypto"
import { db, jsonb } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "../auth"

export const uniqueSuffix = () => crypto.randomUUID().slice(0, 8)

export interface TagCategoryOption {
  id: string
  label: string
}

export interface TagCategory {
  id: string
  label: string
  isRequired: boolean
  display?: "pills" | "plaintext"
  options: TagCategoryOption[]
}

// `collection.getCollectionTags` (what every collection-item drawer queries
// to know which tag categories exist) only ever reads the index page's
// *published* blob — there is no draft fallback. So the tag categories here
// must be published, not just drafted, or drawers under test won't see them.
export const createCollectionWithTagCategories = async (
  tagCategories: TagCategory[],
  siteId: number,
) => {
  const suffix = uniqueSuffix()

  const collection = await db
    .insertInto("Resource")
    .values({
      permalink: `e2e-tags-collection-${suffix}`,
      siteId,
      parentId: null,
      title: "E2E Tags Collection",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.Collection,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexBlob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "collection",
        page: {
          title: "E2E Tags Collection",
          subtitle: "E2E test subtitle",
          tagCategories,
        },
        content: [],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexPage = await db
    .insertInto("Resource")
    .values({
      permalink: `e2e-tags-index-${suffix}`,
      siteId,
      parentId: collection.id,
      title: "E2E Tags Index",
      draftBlobId: null,
      state: ResourceState.Draft,
      type: ResourceType.IndexPage,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const admin = await db
    .selectFrom("User")
    .where("email", "=", TEST_EMAILS.admin)
    .select("id")
    .executeTakeFirstOrThrow()

  const version = await db
    .insertInto("Version")
    .values({
      versionNum: 1,
      resourceId: indexPage.id,
      blobId: indexBlob.id,
      publishedBy: admin.id,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await db
    .updateTable("Resource")
    .where("id", "=", indexPage.id)
    .set({ publishedVersionId: version.id })
    .execute()

  return { collectionId: collection.id, indexPageId: indexPage.id }
}

// Cascades to the index page and any collection items (Resource.parent is
// onDelete: Cascade).
export const deleteCollection = (collectionId: string) =>
  db.deleteFrom("Resource").where("id", "=", collectionId).execute()

export const createCollectionLink = async ({
  collectionId,
  ref,
  siteId,
  tagged = [],
  title = "E2E Tags Link",
}: {
  collectionId: string
  ref: string
  siteId: number
  tagged?: string[]
  title?: string
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "link",
        page: { ref, summary: "", category: "", date: "01/01/2026", tagged },
        content: [],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return db
    .insertInto("Resource")
    .values({
      permalink: `e2e-tags-link-${uniqueSuffix()}`,
      siteId,
      parentId: collectionId,
      title,
      type: ResourceType.CollectionLink,
      state: ResourceState.Draft,
      draftBlobId: blob.id,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const createCollectionPage = async ({
  collectionId,
  siteId,
  tagged = [],
  title = "E2E Tags Page",
}: {
  collectionId: string
  siteId: number
  tagged?: string[]
  title?: string
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        layout: "article",
        page: {
          date: "01/01/2026",
          category: "Feature Articles",
          articlePageHeader: { summary: "E2E test summary" },
          tagged,
        },
        content: [],
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return db
    .insertInto("Resource")
    .values({
      permalink: `e2e-tags-page-${uniqueSuffix()}`,
      siteId,
      parentId: collectionId,
      title,
      type: ResourceType.CollectionPage,
      state: ResourceState.Draft,
      draftBlobId: blob.id,
      publishedVersionId: null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const seedCollectionPages = async ({
  siteId,
  collectionId,
  count,
  titlePrefix = "E2E Sort Item",
}: {
  siteId: number
  collectionId: string
  count: number
  titlePrefix?: string
}) =>
  Promise.all(
    Array.from({ length: count }, (_, i) => {
      const title = `${titlePrefix} ${String(i + 1).padStart(2, "0")}`
      return createCollectionPage({
        collectionId,
        siteId,
        title,
      })
    }),
  )
