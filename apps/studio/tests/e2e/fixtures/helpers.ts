import { type Page } from "@playwright/test"
import { db } from "~/server/modules/database"
import { ResourceType, type RoleType } from "~prisma/generated/generatedEnums"

import { DashboardPO } from "./dashboard.po"
import { PageEditorPO } from "./page-editor.po"
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
