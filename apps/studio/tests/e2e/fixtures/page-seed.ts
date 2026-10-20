import type { UnwrapTagged } from "type-fest"
import crypto from "crypto"
import {
  setupCollection,
  setupCollectionLink,
  setupCollectionPage,
  setupFolder,
  setupPageResource,
} from "tests/integration/helpers/seed"
import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import { db, jsonb } from "~/server/modules/database"
import {
  ResourceState,
  ResourceType,
  type ScheduledAction,
} from "~prisma/generated/generatedEnums"

/** Prose preview label from the default integration seed blob. */
export const SEEDED_PROSE_BLOCK_LABEL = "Test block"

export const seedFolder = async ({
  siteId,
  folderTitle = "E2E Seed Folder",
}: {
  siteId: number
  folderTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder } = await setupFolder({
    siteId,
    title: folderTitle,
    permalink: `e2e-folder-${suffix}`,
  })
  return { folder }
}

export const seedRootPage = async ({
  siteId,
  userId,
  state = ResourceState.Draft,
  pageTitle,
  pagePermalink,
}: {
  siteId: number
  userId?: string
  state?: ResourceState
  pageTitle: string
  pagePermalink?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: null,
    title: pageTitle,
    permalink: pagePermalink ?? `e2e-page-${suffix}`,
    state,
    userId,
  })
  return { page }
}

// Seeds a live (published) page — Published state + a published version, which
// is what "live" means to the unpublish flow. Pass `scheduledAt` +
// `scheduledAction` to seed a page that's also scheduled (e.g. a pending
// unpublish). `parentId`/`resourceType` let callers seed a container's index
// page or a child under it.
export const seedPublishedPage = async ({
  siteId,
  userId,
  pageTitle = "E2E Live Page",
  pagePermalink,
  parentId = null,
  resourceType = ResourceType.Page,
  scheduledAt = null,
  scheduledAction = null,
}: {
  siteId: number
  userId: string
  pageTitle?: string
  pagePermalink?: string
  parentId?: string | null
  resourceType?: ResourceType
  scheduledAt?: Date | null
  scheduledAction?: ScheduledAction | null
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { page } = await setupPageResource({
    siteId,
    resourceType,
    parentId,
    title: pageTitle,
    permalink: pagePermalink ?? `e2e-live-${suffix}`,
    state: ResourceState.Published,
    userId,
    scheduledAt,
    scheduledBy: scheduledAt ? userId : null,
    scheduledAction,
  })
  return { page }
}

export const seedFolderWithPage = async ({
  siteId,
  userId,
  state = ResourceState.Draft,
  pageTitle = "E2E Seed Page",
  pagePermalink,
  folderTitle = "E2E Seed Folder",
}: {
  siteId: number
  userId?: string
  state?: ResourceState
  pageTitle?: string
  pagePermalink?: string
  folderTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder } = await seedFolder({ siteId, folderTitle })
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: folder.id,
    title: pageTitle,
    permalink: pagePermalink ?? `e2e-page-${suffix}`,
    state,
    userId,
  })
  return { folder, page }
}

export const seedCollectionWithPage = async ({
  siteId,
  collectionTitle = "E2E Seed Collection",
  pageTitle = "E2E Collection Page",
}: {
  siteId: number
  collectionTitle?: string
  pageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: collection.id,
    title: collectionTitle,
  })
  const { page } = await setupCollectionPage({
    siteId,
    parentId: collection.id,
    title: pageTitle,
    permalink: `e2e-collection-page-${suffix}`,
  })
  return { collection, collectionPage: page }
}

export const seedTwoCollections = async ({
  siteId,
  sourceCollectionTitle = "E2E Source Collection",
  destCollectionTitle = "E2E Dest Collection",
  collectionPageTitle = "E2E Movable Collection Page",
}: {
  siteId: number
  sourceCollectionTitle?: string
  destCollectionTitle?: string
  collectionPageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection: sourceCollection } = await setupCollection({
    siteId,
    title: sourceCollectionTitle,
    permalink: `e2e-src-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: sourceCollection.id,
    title: sourceCollectionTitle,
  })
  const { collection: destCollection } = await setupCollection({
    siteId,
    title: destCollectionTitle,
    permalink: `e2e-dest-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: destCollection.id,
    title: destCollectionTitle,
  })
  const { page: collectionPage } = await setupCollectionPage({
    siteId,
    parentId: sourceCollection.id,
    title: collectionPageTitle,
    permalink: `e2e-movable-col-page-${suffix}`,
  })
  return { sourceCollection, destCollection, collectionPage }
}

export const seedCollectionWithLink = async ({
  siteId,
  collectionTitle = "E2E Seed Collection",
  linkTitle = "E2E Collection Link",
}: {
  siteId: number
  collectionTitle?: string
  linkTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-collection-${suffix}`,
  })
  await seedCollectionIndexPage({
    siteId,
    collectionId: collection.id,
    title: collectionTitle,
  })
  const { collectionLink } = await setupCollectionLink({
    siteId,
    collectionId: collection.id,
    title: linkTitle,
    permalink: `e2e-collection-link-${suffix}`,
  })
  return { collection, collectionLink }
}

export const seedRootCollection = async ({
  siteId,
  collectionTitle = "E2E Root Collection",
}: {
  siteId: number
  collectionTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-root-collection-${suffix}`,
  })
  return { collection }
}

/** Matches `createCollectionIndexJson` in `collection.service.ts`. */
const collectionIndexBlobContent = (
  title: string,
): UnwrapTagged<PrismaJson.BlobJsonContent> => ({
  layout: "collection",
  page: {
    title,
    subtitle:
      "Read up-to-date news articles, speeches, and press releases here.",
    sortOrder: "date-desc",
  },
  content: [],
  version: "0.1.0",
})

/**
 * `setupCollection` only inserts the Collection resource. The real
 * `collection.create` flow also creates an IndexPage child, which item
 * editors need in order to load.
 */
const seedCollectionIndexPage = async ({
  siteId,
  collectionId,
  title,
}: {
  siteId: number
  collectionId: string
  title: string
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({ content: jsonb(collectionIndexBlobContent(title)) })
    .returningAll()
    .executeTakeFirstOrThrow()

  return db
    .insertInto("Resource")
    .values({
      title,
      permalink: INDEX_PAGE_PERMALINK,
      siteId,
      parentId: collectionId,
      draftBlobId: blob.id,
      type: ResourceType.IndexPage,
      state: ResourceState.Draft,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

export const seedCollection = async ({
  siteId,
  collectionTitle = "E2E Seed Collection",
}: {
  siteId: number
  collectionTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collection } = await setupCollection({
    siteId,
    title: collectionTitle,
    permalink: `e2e-collection-${suffix}`,
  })
  const indexPage = await seedCollectionIndexPage({
    siteId,
    collectionId: collection.id,
    title: collectionTitle,
  })
  return { collection, indexPage }
}

export const seedCollectionLink = async ({
  siteId,
  collectionId,
  linkTitle = "E2E Collection Link",
}: {
  siteId: number
  collectionId: string
  linkTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { collectionLink } = await setupCollectionLink({
    siteId,
    collectionId,
    title: linkTitle,
    permalink: `e2e-collection-link-${suffix}`,
  })
  return { collectionLink }
}
