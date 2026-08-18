import { type Browser, type BrowserContext, type Page } from "@playwright/test"
import { type RoleType } from "~prisma/generated/generatedEnums"

import { storageStateFor, type Role } from "./auth"
import { DashboardPO } from "./dashboard.po"
import { PageEditorPO } from "./page-editor.po"
import { getFolderByTitle } from "./resource.db"
import { UsersPO } from "./users.po"

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

  await page.waitForURL(new RegExp(`/sites/${siteId}/pages/\\d+$`))
  const pageId = page.url().match(/\/pages\/(\d+)$/)?.[1]
  if (!pageId) {
    throw new Error(`Expected page editor URL after wizard, got ${page.url()}`)
  }
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
  }: { startUrl: string; title: string; siteId: number },
) => {
  await page.goto(startUrl)

  const dashboard = new DashboardPO(page)
  await dashboard.openCreateMenu()
  await dashboard.clickCreateCollection()
  await dashboard.fillCollectionWizard(title)

  const collection = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("title", "=", title)
    .where("type", "=", ResourceType.Collection)
    .select("id")
    .executeTakeFirstOrThrow()

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
  await dashboard.openAddCollectionItem()
  await dashboard.selectCollectionItemType(type)
  await dashboard.fillCollectionItemWizard(title)

  const subpath = type === "Page" ? "pages" : "links"
  await page.waitForURL(new RegExp(`/sites/${siteId}/${subpath}/\\d+$`))
  const itemId = page.url().match(new RegExp(`/${subpath}/(\\d+)$`))?.[1]
  if (!itemId) {
    throw new Error(`Expected ${subpath} URL after wizard, got ${page.url()}`)
  }
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
