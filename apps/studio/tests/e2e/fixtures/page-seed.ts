import { expect } from "@playwright/test"
import crypto from "crypto"
import {
  setupCollection,
  setupCollectionLink,
  setupCollectionPage,
  setupFolder,
  setupPageResource,
} from "tests/integration/helpers/seed"
import { db } from "~/server/modules/database"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

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

export const seedFolderWithChildPage = async ({
  siteId,
  folderTitle = "E2E Seed Folder",
  pageTitle = "E2E Child Page",
}: {
  siteId: number
  folderTitle?: string
  pageTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder } = await seedFolder({ siteId, folderTitle })
  const { page } = await setupPageResource({
    siteId,
    resourceType: ResourceType.Page,
    parentId: folder.id,
    title: pageTitle,
    permalink: `e2e-child-page-${suffix}`,
  })
  return { folder, childPage: page }
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
  const { collection: destCollection } = await setupCollection({
    siteId,
    title: destCollectionTitle,
    permalink: `e2e-dest-collection-${suffix}`,
  })
  const { page: collectionPage } = await setupCollectionPage({
    siteId,
    parentId: sourceCollection.id,
    title: collectionPageTitle,
    permalink: `e2e-movable-col-page-${suffix}`,
  })
  return { sourceCollection, destCollection, collectionPage }
}

export const seedNestedFolder = async ({
  siteId,
  parentFolderTitle = "E2E Parent Folder",
  childFolderTitle = "E2E Nested Folder",
}: {
  siteId: number
  parentFolderTitle?: string
  childFolderTitle?: string
}) => {
  const suffix = crypto.randomUUID().slice(0, 8)
  const { folder: parentFolder } = await seedFolder({
    siteId,
    folderTitle: parentFolderTitle,
  })
  const { folder: childFolder } = await setupFolder({
    siteId,
    title: childFolderTitle,
    permalink: `e2e-nested-folder-${suffix}`,
    parentId: parentFolder.id,
  })
  return { parentFolder, childFolder }
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

export const expectResourceAbsent = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("id")
      .executeTakeFirst()
    return row?.id ?? null
  })

export const expectResourcePresent = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("id")
      .executeTakeFirst()
    return row?.id ?? null
  })

export const expectResourceParentId = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("parentId")
      .executeTakeFirst()
    return row?.parentId ?? null
  })

export const expectResourceTitle = (resourceId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", resourceId)
      .select("title")
      .executeTakeFirst()
    return row?.title ?? null
  })
