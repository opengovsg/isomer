import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteNotification } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { expectSiteNotificationTitle } from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
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
    await expect(expectSiteNotificationTitle(siteId)).resolves.toBe(
      notificationTitle,
    )
    await site.reloadSettingsSection("notification")
    await expect(site.notificationBannerToggle()).toBeChecked()
    await expect(site.notificationTitleField()).toHaveValue(notificationTitle)
  })
})
