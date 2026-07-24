import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { openSeededPageEditor } from "../fixtures/helpers"
import { seedFolderWithPage } from "../fixtures/page-seed"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const DEFAULT_PAGE_TITLE = "E2E Seed Page"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher can schedule publish, see dashboard badge, cancel, and clear DB schedule", async ({
    page,
  }) => {
    // Arrange
    const { folder, page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    // Freeze the clock at a fixed early-morning time so the "Quick select a
    // time?" presets (00:00/09:00/13:00/17:00) are always available: they're
    // hidden once every preset for the day has already passed, which made
    // this flow fail deterministically whenever the suite ran late in the
    // day (real time was in the past relative to those presets).
    await page.clock.install({ time: new Date("2099-01-01T00:01:00+08:00") })

    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()
    await editor.expectCancelScheduleVisible()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .not.toBeNull()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledBy)
      .not.toBeNull()

    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.expectScheduledBadge(DEFAULT_PAGE_TITLE)

    await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.cancelSchedule()
    await editor.expectPublishButtonVisible()

    // Assert
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .toBeNull()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledBy)
      .toBeNull()
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
