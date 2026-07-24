import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { FolderSettingsPO } from "../fixtures/folder-settings.po"
import { seedFolder } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can rename a folder via FolderSettingsModal", async ({
    page,
  }) => {
    const folderTitle = `Rename Folder ${crypto.randomUUID().slice(0, 8)}`
    const newTitle = `Renamed ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openFolderSettings(folderTitle)

    const settings = new FolderSettingsPO(page)
    await settings.expectLoaded()
    await settings.fillTitle(newTitle)
    await settings.saveChanges()

    const updated = await db
      .selectFrom("Resource")
      .where("id", "=", folder.id)
      .select("title")
      .executeTakeFirst()
    expect(updated?.title).toBe(newTitle)
  })
})
