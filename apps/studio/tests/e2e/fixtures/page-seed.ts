import { expect } from "@playwright/test"
import crypto from "crypto"
import { setupFolder, setupPageResource } from "tests/integration/helpers/seed"
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

export const expectPageScheduledAt = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("scheduledAt")
      .executeTakeFirst()
    return row?.scheduledAt ?? null
  })

export const expectPageState = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("state")
      .executeTakeFirst()
    return row?.state ?? null
  })

export const expectPageTitle = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("title")
      .executeTakeFirst()
    return row?.title ?? null
  })

export const expectPageScheduledBy = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("scheduledBy")
      .executeTakeFirst()
    return row?.scheduledBy ?? null
  })

export const expectPagePermalink = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("permalink")
      .executeTakeFirst()
    return row?.permalink ?? null
  })

export const expectDraftBlobContainsText = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .innerJoin("Blob", "Blob.id", "Resource.draftBlobId")
      .where("Resource.id", "=", pageId)
      .select("Blob.content")
      .executeTakeFirst()
    if (!row?.content) return ""
    return JSON.stringify(row.content)
  })

export const expectPageDraftBlobId = (pageId: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Resource")
      .where("id", "=", pageId)
      .select("draftBlobId")
      .executeTakeFirst()
    return row?.draftBlobId ?? null
  })
