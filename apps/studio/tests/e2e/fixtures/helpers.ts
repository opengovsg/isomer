import { type Browser, type BrowserContext, type Page } from "@playwright/test"
import { type RoleType } from "~prisma/generated/generatedEnums"

import { storageStateFor, type Role } from "./auth"
import { CollectionPO } from "./po/collection"
import { DashboardPO } from "./po/dashboard"
import { PageEditorPO } from "./po/page-editor"
import { UsersPO } from "./po/users"
import { getCollectionByTitle, getFolderByTitle } from "./resource/db"

export const openSeededPageEditor = async (
  page: Page,
  siteId: number,
  pageId: string,
) => {
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
) => {
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

  const pageId = await dashboard.expectOnNewPageEditor(siteId)
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
  await dashboard.openCollectionItemWizard()
  await dashboard.selectCollectionItemType(type)
  await dashboard.fillCollectionItemWizard(title)

  const itemId = await dashboard.expectOnCollectionItemEditor(
    siteId,
    type === "Page" ? "page" : "link",
  )
  return { itemId }
}

export const createCollectionPageViaWizard = async (
  page: Page,
  {
    siteId,
    collectionId,
    title,
  }: { siteId: number; collectionId: string; title: string },
) => {
  const { itemId } = await createCollectionItemViaWizard(page, {
    siteId,
    collectionId,
    type: "Page",
    title,
  })
  return { pageId: itemId }
}

export const createCollectionLinkViaWizard = async (
  page: Page,
  {
    siteId,
    collectionId,
    title,
  }: { siteId: number; collectionId: string; title: string },
) => {
  const { itemId } = await createCollectionItemViaWizard(page, {
    siteId,
    collectionId,
    type: "Link or file",
    title,
  })
  return { linkId: itemId }
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
