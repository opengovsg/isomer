import { type Page } from "@playwright/test"
import { db } from "~/server/modules/database"
import { ResourceType, type RoleType } from "~prisma/generated/generatedEnums"

import { DashboardPO, PageEditorPO, UsersPO } from "./po"

// Fix clock at 00:01 so schedule presets haven't expired. Late-day CI was flaky.
const SCHEDULE_PRESET_CLOCK_TIME = new Date("2099-01-01T00:01:00+08:00")

export const openSeededPageEditor = async (
  page: Page,
  siteId: number,
  pageId: string,
  options?: { scheduleClock?: boolean },
) => {
  // Playwright requires clock.install before navigation.
  if (options?.scheduleClock) {
    await page.clock.install({ time: SCHEDULE_PRESET_CLOCK_TIME })
  }
  const editor = new PageEditorPO(page)
  await editor.gotoPage(siteId, pageId)
  await editor.expectLoaded()
  return editor
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

  const folder = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("title", "=", title)
    .where("type", "=", ResourceType.Folder)
    .select("id")
    .executeTakeFirstOrThrow()

  return { folderId: folder.id }
}

export const createCollectionViaWizard = async (
  page: Page,
  { siteId, title }: { siteId: number; title: string },
) => {
  const dashboard = new DashboardPO(page)
  await dashboard.gotoSite(siteId)
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

export const openInviteModal = async (page: Page, siteId: number) => {
  const users = new UsersPO(page)
  await users.goto(siteId)
  await users.openAddUser()
}

export const inviteCollaborator = async (
  page: Page,
  {
    email,
    role,
    siteId,
  }: { email: string; role: keyof typeof RoleType; siteId: number },
) => {
  await openInviteModal(page, siteId)
  const users = new UsersPO(page)
  await users.fillInviteForm(email, role)
  await users.sendInvite()
}
