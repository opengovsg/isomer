import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteNotification } from "~e2e/fixtures/reset"
import {
  expectSiteNotificationTitle,
  provisionE2ESite,
} from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteNotification(siteId)
  })

  test("admin can save a notification title", async ({ page }) => {
    const site = new SitePO(page)
    const notificationTitle = "e2e test notification"

    // Arrange
    await site.gotoSettingsSection(siteId, "notification")
    await expect(site.notificationBannerToggle()).toBeVisible()

    // Act
    await site.enableNotificationBanner()
    await site.expectNotificationTitleFieldVisible()
    await site.fillNotificationTitle(notificationTitle)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteNotificationTitle(siteId).toBe(notificationTitle)
    await site.reloadSettingsSection("notification")
    await expect(site.notificationBannerToggle()).toBeChecked()
    await expect(site.notificationTitleField()).toHaveValue(notificationTitle)
  })
})
