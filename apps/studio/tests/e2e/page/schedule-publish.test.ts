import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { openSeededPageEditor } from "../fixtures/helpers"
import {
  expectResourceScheduledAt,
  expectResourceScheduledBy,
  seedFolderWithPage,
} from "../fixtures/page-seed"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const DEFAULT_PAGE_TITLE = "E2E Seed Page"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor],
  })
  siteId = site.siteId
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher can schedule publish and populate DB schedule fields", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.installFixedClockForSchedulePresets()
    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()
    await editor.expectCancelScheduleVisible()

    // Assert
    await expectResourceScheduledAt(seededPage.id).not.toBeNull()
    await expectResourceScheduledBy(seededPage.id).not.toBeNull()
  })

  test("publisher sees scheduled badge on dashboard", async ({ page }) => {
    // Arrange
    const { folder, page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.installFixedClockForSchedulePresets()
    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)

    // Assert
    await dashboard.expectScheduledBadge(DEFAULT_PAGE_TITLE)
    await expectResourceScheduledAt(seededPage.id).not.toBeNull()
    await expectResourceScheduledBy(seededPage.id).not.toBeNull()
  })

  test("publisher can cancel schedule and clear DB schedule fields", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.installFixedClockForSchedulePresets()
    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()

    // Act
    const editorAfterSchedule = await openSeededPageEditor(
      page,
      siteId,
      seededPage.id,
    )
    await editorAfterSchedule.cancelSchedule()

    // Assert
    await editorAfterSchedule.expectPublishButtonVisible()
    await expectResourceScheduledAt(seededPage.id).toBeNull()
    await expectResourceScheduledBy(seededPage.id).toBeNull()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor does not see publish or schedule controls on the page editor", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Assert
    await editor.expectPublishButtonHidden()
    await editor.expectScheduleOptionsHidden()
  })
})
