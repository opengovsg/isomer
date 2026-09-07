import crypto from "node:crypto"
import { db } from "~/server/modules/database/database"
import { jsonb } from "~/server/modules/database/utils"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS } from "./auth"
import { getSeedSiteId } from "./seed"

export const uniqueSuffix = () => crypto.randomUUID().slice(0, 8)

export interface TagCategoryOption {
  id: string
  label: string
}

export interface TagCategory {
  id: string
  label: string
  isRequired: boolean
  options: TagCategoryOption[]
}

// `collection.getCollectionTags` (what every collection-item drawer queries
// to know which tag categories exist) only ever reads the index page's
// *published* blob — there is no draft fallback. So the tag categories here
// must be published, not just drafted, or drawers under test won't see them.
export const createCollectionWithTagCategories = async (
  tagCategories: TagCategory[],
) => {
  const siteId = getSeedSiteId()
  const suffix = uniqueSuffix()

  const collection = await db
    .insertInto("Resource")
    .values({
      draftBlobId: null,
      parentId: null,
      permalink: `e2e-tags-collection-${suffix}`,
      publishedVersionId: null,
      siteId,
      state: ResourceState.Draft,
      title: "E2E Tags Collection",
      type: ResourceType.Collection,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexBlob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        content: [],
        layout: "collection",
        page: {
          subtitle: "E2E test subtitle",
          tagCategories,
          title: "E2E Tags Collection",
        },
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  const indexPage = await db
    .insertInto("Resource")
    .values({
      draftBlobId: null,
      parentId: collection.id,
      permalink: `e2e-tags-index-${suffix}`,
      publishedVersionId: null,
      siteId,
      state: ResourceState.Draft,
      title: "E2E Tags Index",
      type: ResourceType.IndexPage,
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
      blobId: indexBlob.id,
      publishedBy: admin.id,
      resourceId: indexPage.id,
      versionNum: 1,
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
export const deleteCollection = async (collectionId: string) =>
  await db.deleteFrom("Resource").where("id", "=", collectionId).execute()

export const createCollectionLink = async ({
  collectionId,
  ref,
  siteId = getSeedSiteId(),
}: {
  collectionId: string
  ref: string
  siteId?: number
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        content: [],
        layout: "link",
        page: { category: "", date: "01/01/2026", ref, summary: "" },
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return await db
    .insertInto("Resource")
    .values({
      draftBlobId: blob.id,
      parentId: collectionId,
      permalink: `e2e-tags-link-${uniqueSuffix()}`,
      publishedVersionId: null,
      siteId,
      state: ResourceState.Draft,
      title: "E2E Tags Link",
      type: ResourceType.CollectionLink,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const createCollectionPage = async ({
  collectionId,
  siteId = getSeedSiteId(),
}: {
  collectionId: string
  siteId?: number
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({
      content: jsonb({
        content: [],
        layout: "article",
        page: {
          articlePageHeader: { summary: "E2E test summary" },
          category: "Feature Articles",
          date: "01/01/2026",
        },
        version: "0.1.0",
      }),
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return await db
    .insertInto("Resource")
    .values({
      draftBlobId: blob.id,
      parentId: collectionId,
      permalink: `e2e-tags-page-${uniqueSuffix()}`,
      publishedVersionId: null,
      siteId,
      state: ResourceState.Draft,
      title: "E2E Tags Page",
      type: ResourceType.CollectionPage,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

const readBlobPageContent = (
  content: PrismaJson.BlobJsonContent,
): { page: { tagged?: string[] } } =>
  // SAFETY: e2e fixtures only read optional tagged tags from article page blobs.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  content as { page: { tagged?: string[] } }

export const readBlobContent = async (blobId: string) => {
  const blob = await db
    .selectFrom("Blob")
    .where("id", "=", blobId)
    .select("content")
    .executeTakeFirstOrThrow()
  return readBlobPageContent(blob.content)
}

export const getRootPageId = async (siteId = getSeedSiteId()) => {
  const rootPage = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("type", "=", ResourceType.RootPage)
    .select("id")
    .executeTakeFirstOrThrow()
  return rootPage.id
}
