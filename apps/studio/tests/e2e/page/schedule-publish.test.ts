import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { openSeededPageEditor } from "~e2e/fixtures/helpers"
import { DashboardPO } from "~e2e/fixtures/po"
import {
  expectResourceScheduledAt,
  expectResourceScheduledBy,
  getResource,
  seedFolderWithPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
    const editor = await openSeededPageEditor(page, siteId, seededPage.id, {
      scheduleClock: true,
    })
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
    const editor = await openSeededPageEditor(page, siteId, seededPage.id, {
      scheduleClock: true,
    })
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
    const editor = await openSeededPageEditor(page, siteId, seededPage.id, {
      scheduleClock: true,
    })
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

  test("publisher can reschedule a scheduled publish to a different time", async ({
    page,
  }) => {
    // Arrange. The quick-select presets (00:00/09:00/13:00/17:00) filter to
    // whichever are still later than "now" in the browser's (UTC, on CI)
    // wall-clock reading of the frozen instant — the shared `scheduleClock`
    // option freezes to an instant that reads as mid-afternoon in UTC,
    // leaving only the 17:00 preset, which is fine for tests that only ever
    // pick one time. This test needs two distinct presets to reschedule
    // between, so it freezes to an instant that's early-morning in UTC
    // instead, via a direct clock install rather than `scheduleClock`.
    const { page: seededPage } = await seedFolderWithPage({ siteId })
    await page.clock.install({ time: new Date("2099-01-01T00:01:00Z") })

    // Act: schedule for the 5:00 PM quick-select slot
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)
    await editor.openScheduleModal()
    await editor.schedulePublishForToday("5:00 PM")
    await editor.expectScheduledSuccessfully()
    await expectResourceScheduledAt(seededPage.id).not.toBeNull()
    const scheduledAtFirst = (await getResource(seededPage.id))?.scheduledAt

    // Act: cancel and reschedule to a different (earlier) quick-select slot.
    // Wait for the cancel's DB write to fully settle before reopening the
    // modal for the new schedule.
    await editor.cancelSchedule()
    await expectResourceScheduledAt(seededPage.id).toBeNull()
    await editor.openScheduleModal()
    await editor.schedulePublishForToday("9:00 AM")
    await editor.expectScheduledSuccessfully()

    // Assert
    await expectResourceScheduledAt(seededPage.id).not.toBeNull()
    await expect
      .poll(async () => (await getResource(seededPage.id))?.scheduledAt)
      .not.toEqual(scheduledAtFirst)
  })

  test("scheduled status survives reload and blocks further editing", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id, {
      scheduleClock: true,
    })
    await editor.openScheduleModal()
    await editor.schedulePublishForToday()
    await editor.expectScheduledSuccessfully()
    await editor.reload()

    // Assert
    await editor.expectCancelScheduleVisible()
    await editor.expectScheduledEditingRestrictionBanner()
    await expectResourceScheduledAt(seededPage.id).not.toBeNull()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor sees disabled publish and schedule controls on the page editor", async ({
    page,
  }) => {
    // Arrange
    const { page: seededPage } = await seedFolderWithPage({ siteId })

    // Act
    const editor = await openSeededPageEditor(page, siteId, seededPage.id)

    // Assert
    await editor.expectPublishButtonDisabled()
    await editor.expectScheduleOptionsDisabled()
  })
})
