import { type Browser, type BrowserContext, type Page } from "@playwright/test"
import { IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { type RoleType } from "~prisma/generated/generatedEnums"

import { storageStateFor, type Role } from "./auth"
import { CollectionPO } from "./collection.po"
import { enableGrowthBookFeature, resetGrowthBookPage } from "./network"
import { DashboardPO } from "./po/dashboard"
import { PageEditorPO } from "./po/page-editor"
import { UsersPO } from "./po/users"
import { getCollectionByTitle, getFolderByTitle } from "./resource/db"

const SCHEDULE_PRESET_CLOCK_TIME = new Date("2099-01-01T00:01:00+08:00")

export const openSeededPageEditor = async (
  page: Page,
  siteId: number,
  pageId: string,
  options?: { scheduleClock?: boolean },
) => {
  if (options?.scheduleClock) {
    await page.clock.install({ time: SCHEDULE_PRESET_CLOCK_TIME })
  }
  const editor = new PageEditorPO(page)
  await editor.gotoPage(siteId, pageId)
  await editor.expectLoaded()
  return editor
}

/** Cross-role flows: open the page editor under a different role's session. */
export const openSeededPageEditorAsRole = async (
  browser: Browser,
  role: Role,
  siteId: number,
  pageId: string,
): Promise<RoleBrowserSession> => {
  const context = await browser.newContext({
    storageState: storageStateFor(role),
  })
  const page = await context.newPage()
  const editor = await openSeededPageEditor(page, siteId, pageId)
  return { context, page, editor }
}

/**
 * Secondary browser context for a different role. The context is always closed
 * in `finally` — prefer this over `openSeededPageEditorAsRole` when you only
 * need a short-lived second session.
 */
export const withRoleSession = async <T>(
  browser: Browser,
  role: Role,
  fn: (session: { context: BrowserContext; page: Page }) => Promise<T>,
): Promise<T> => {
  const context = await browser.newContext({
    storageState: storageStateFor(role),
  })
  const page = await context.newPage()
  try {
    return await fn({ context, page })
  } finally {
    await context.close()
  }
}

/**
 * Cross-role page-editor flows. Opens the editor under `role`'s session, runs
 * `fn`, then closes the context — use for editor-then-publisher handoffs.
 */
export const withSeededPageEditorAsRole = async <T>(
  browser: Browser,
  role: Role,
  siteId: number,
  pageId: string,
  fn: (session: RoleBrowserSession) => Promise<T>,
): Promise<T> => {
  const session = await openSeededPageEditorAsRole(
    browser,
    role,
    siteId,
    pageId,
  )
  try {
    return await fn(session)
  } finally {
    await session.context.close()
  }
}

export interface RoleBrowserSession {
  context: BrowserContext
  page: Page
  editor: PageEditorPO
}

export const openCollectionIndexEditor = async (
  page: Page,
  siteId: number,
  indexPageId: string,
  opts?: { filtersEnabled?: boolean },
) => {
  const filtersEnabled = opts?.filtersEnabled ?? true
  await enableGrowthBookFeature(
    page,
    IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY,
    filtersEnabled,
  )
  await resetGrowthBookPage(page)
  const collection = new CollectionPO(page)
  await collection.gotoIndex(siteId, indexPageId)
  return collection
}

export const createPageViaWizard = async (
  page: Page,
  {
    startUrl,
    title,
    siteId,
  }: { startUrl: string; title: string; siteId: number },
) => {
  await page.goto(startUrl)

  const dashboard = new DashboardPO(page)
  await dashboard.openCreateMenu()
  await dashboard.clickCreatePage()
  await dashboard.fillPageWizard(title)

  const pageId = await dashboard.capturePageEditorIdFromUrl(siteId)
  return { pageId }
}

export const createFolderViaWizard = async (
  page: Page,
  { siteId, title }: { siteId: number; title: string },
) => {
  const dashboard = new DashboardPO(page)
  await dashboard.gotoSite(siteId)
  await dashboard.openCreateMenu()
  await dashboard.clickCreateFolder()
  await dashboard.fillFolderWizard(title)

  const folder = await getFolderByTitle({ siteId, title })
  return { folderId: folder.id }
}

export const createCollectionViaWizard = async (
  page: Page,
  {
    startUrl,
    title,
    siteId,
  }: { startUrl?: string; title: string; siteId: number },
) => {
  const dashboard = new DashboardPO(page)
  if (startUrl) {
    await page.goto(startUrl)
  } else {
    await dashboard.gotoSite(siteId)
  }
  await dashboard.openCreateMenu()
  await dashboard.clickCreateCollection()
  await dashboard.fillCollectionWizard(title)

  const collection = await getCollectionByTitle({ siteId, title })
  return { collectionId: collection.id }
}

export const createCollectionPageViaWizard = async (
  page: Page,
  {
    siteId,
    collectionId,
    title,
  }: { siteId: number; collectionId: string; title: string },
) => {
  const dashboard = new DashboardPO(page)
  await dashboard.gotoCollection(siteId, collectionId)
  await dashboard.clickAddCollectionItem()
  await dashboard.proceedToCollectionItemDetails()
  await dashboard.fillCollectionPageWizard(title)

  await page.waitForURL(new RegExp(`/sites/${siteId}/pages/\\d+$`))
  const pageId = page.url().match(/\/pages\/(\d+)$/)?.[1]
  if (!pageId) {
    throw new Error(`Expected page editor URL after wizard, got ${page.url()}`)
  }
  return { pageId }
}

export const createCollectionLinkViaWizard = async (
  page: Page,
  {
    siteId,
    collectionId,
    title,
  }: { siteId: number; collectionId: string; title: string },
) => {
  const dashboard = new DashboardPO(page)
  await dashboard.gotoCollection(siteId, collectionId)
  await dashboard.clickAddCollectionItem()
  await dashboard.selectCollectionItemType("Link or file")
  await dashboard.proceedToCollectionItemDetails()
  await dashboard.fillCollectionLinkWizard(title)

  await page.waitForURL(new RegExp(`/sites/${siteId}/links/\\d+$`))
  const linkId = page.url().match(/\/links\/(\d+)$/)?.[1]
  if (!linkId) {
    throw new Error(`Expected link editor URL after wizard, got ${page.url()}`)
  }
  return { linkId }
}

export const createCollectionItemViaWizard = async (
  page: Page,
  {
    siteId,
    collectionId,
    type,
    title,
  }: {
    siteId: number
    collectionId: string
    type: "Page" | "Link or file"
    title: string
  },
) => {
  const dashboard = new DashboardPO(page)
  await dashboard.gotoCollection(siteId, collectionId)
  await dashboard.openAddCollectionItem()
  if (type === "Link or file") {
    await dashboard.selectCollectionItemType(type)
  }
  await dashboard.proceedToCollectionItemDetails()
  if (type === "Page") {
    await dashboard.fillCollectionPageWizard(title)
  } else {
    await dashboard.fillCollectionLinkWizard(title)
  }

  const itemId = await dashboard.captureCollectionItemIdFromUrl(siteId, type)
  return { itemId }
}

export const openInviteModal = async (page: Page, siteId: number) => {
  const users = new UsersPO(page)
  await users.goto(siteId)
  await users.openAddUser()
  return users
}

export const inviteCollaborator = async (
  page: Page,
  { email, role, siteId }: { email: string; role: RoleType; siteId: number },
) => {
  await openInviteModal(page, siteId)
  const users = new UsersPO(page)
  await users.fillInviteForm(email, role)
  await users.sendInvite()
}
