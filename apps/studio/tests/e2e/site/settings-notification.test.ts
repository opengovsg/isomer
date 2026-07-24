import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteNotification } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

test.describe("notification settings", { tag: roleTag("admin") }, () => {
  let siteId: number

  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.afterAll(async () => {
    await teardownE2ESite(siteId)
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteNotification(siteId)
  })

  test("admin can save a notification title", async ({ page }) => {
    const site = new SitePO(page)
    await site.gotoSettingsSection(siteId, "notification")

    await expect(site.notificationBannerToggle()).toBeVisible()
    await site.enableNotificationBanner()

    await expect(site.notificationTitleField()).toBeVisible({ timeout: 5000 })
    await site.fillNotificationTitle("e2e test notification")

    await site.clickPublish()
    await site.expectChangesPublishedToast()

    await site.reloadSettingsSection("notification")
    await expect(site.notificationCheckbox()).toBeChecked()
    await expect(site.notificationTitleField()).toHaveValue(
      "e2e test notification",
    )
  })
})
