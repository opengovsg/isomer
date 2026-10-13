import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO, FolderSettingsPO } from "~e2e/fixtures/po"
import { expectResourceTitle, seedFolder } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor],
  })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can rename a folder via FolderSettingsModal", async ({
    page,
  }) => {
    // Arrange
    const folderTitle = `Rename Folder ${crypto.randomUUID().slice(0, 8)}`
    const newTitle = `Renamed ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openFolderSettings(folderTitle)

    const settings = new FolderSettingsPO(page)
    await settings.expectLoaded()
    await settings.fillTitle(newTitle)
    await settings.saveChanges()

    // Assert
    await expectResourceTitle(folder.id).toBe(newTitle)
    await dashboard.expectResourceLinkVisible(newTitle)
  })

  test("admin keeps folder title unchanged when closing settings without saving", async ({
    page,
  }) => {
    // Arrange
    const folderTitle = `Unsaved Folder ${crypto.randomUUID().slice(0, 8)}`
    const newTitle = `Unsaved Rename ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openFolderSettings(folderTitle)

    const settings = new FolderSettingsPO(page)
    await settings.fillTitle(newTitle)
    await settings.closeWithoutSaving()

    // Assert
    await expectResourceTitle(folder.id).toBe(folderTitle)
    await dashboard.expectResourceLinkVisible(folderTitle)
    await dashboard.expectResourceLinkHidden(newTitle)
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can rename a folder via FolderSettingsModal", async ({
    page,
  }) => {
    // Arrange
    const folderTitle = `Editor Folder ${crypto.randomUUID().slice(0, 8)}`
    const newTitle = `Editor Renamed ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openFolderSettings(folderTitle)

    const settings = new FolderSettingsPO(page)
    await settings.expectLoaded()
    await settings.fillTitle(newTitle)
    await settings.saveChanges()

    // Assert
    await expectResourceTitle(folder.id).toBe(newTitle)
    await dashboard.expectResourceLinkVisible(newTitle)
  })
})
