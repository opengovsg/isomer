import crypto from "crypto"
import { setupFolder, setupPageResource } from "tests/integration/helpers/seed"
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
