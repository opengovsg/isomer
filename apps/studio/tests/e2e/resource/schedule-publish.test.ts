import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { openSeededPageEditor } from "../fixtures/helpers"
import { seedFolderWithPage } from "../fixtures/page-seed"
import { getResource } from "../fixtures/resource.db"
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

  test("publisher can reschedule a scheduled publish to a different time", async ({
    page,
  }) => {
    // Arrange. The quick-select presets (00:00/09:00/13:00/17:00) filter to
    // whichever are still later than "now" in the browser's (UTC, on CI)
    // wall-clock reading of the frozen instant — an explicit "+08:00" instant
    // reads as mid-afternoon in UTC, leaving only the 17:00 preset, which is
    // why other tests in this file (needing only one preset) freeze the clock
    // that way. This test needs two distinct presets to reschedule between,
    // so it freezes to an instant that's also early-morning in UTC.
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    await page.clock.install({ time: new Date("2099-01-01T00:01:00Z") })

    // Act: schedule for the 5:00 PM quick-select slot
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openScheduleModal()
    await editor.schedulePublishForToday("5:00 PM")
    await editor.expectScheduledSuccessfully()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .not.toBeNull()
    const scheduledAtFirst = (await getResource(seededPage.id))?.scheduledAt

    // Act: cancel and reschedule to a different (earlier) quick-select slot.
    // Wait for the cancel's DB write (and its readPage refetch) to fully
    // settle before reopening — otherwise a query invalidation mid-way can
    // remount PublishButton's Suspense boundary and silently close the modal
    // this test just opened.
    await editor.cancelSchedule()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .toBeNull()
    await editor.openScheduleModal()
    await editor.schedulePublishForToday("9:00 AM")
    await editor.expectScheduledSuccessfully()

    // Assert
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .not.toBeNull()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .not.toEqual(scheduledAtFirst)
  })

  test("scheduled status survives reload and blocks further editing", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    await page.clock.install({ time: new Date("2099-01-01T00:01:00+08:00") })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()
    await editor.reload()

    // Assert
    await editor.expectCancelScheduleVisible()
    await editor.expectScheduledEditingRestrictionBanner()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .not.toBeNull()
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
