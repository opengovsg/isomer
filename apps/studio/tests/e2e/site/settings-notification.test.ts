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

  test("admin can disable and remove a published notification", async ({
    page,
  }) => {
    const site = new SitePO(page)
    const notificationTitle = "e2e removable notification"

    // Arrange: publish a notification first
    await site.gotoSettingsSection(siteId, "notification")
    await site.enableNotificationBanner()
    await site.expectNotificationTitleFieldVisible()
    await site.fillNotificationTitle(notificationTitle)
    await site.clickPublish()
    await site.expectChangesPublishedToast()
    await expectSiteNotificationTitle(siteId).toBe(notificationTitle)

    // Act
    await site.disableNotificationBanner()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteNotificationTitle(siteId).toBeNull()
    await site.reloadSettingsSection("notification")
    await expect(site.notificationBannerToggle()).not.toBeChecked()
  })

  test("notification title enforces a 150 character limit", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "notification")
    await site.enableNotificationBanner()
    await site.expectNotificationTitleFieldVisible()

    // Act: the input has a native maxlength=150 (mirroring the schema's
    // own maxLength: 150), so typing/pasting more than that never reaches
    // the browser's value — it's truncated before the AJV validator (and
    // its "must NOT have more than 150 characters" message) ever sees it.
    await site.fillNotificationTitle("a".repeat(151))

    // Assert
    await expect(site.notificationTitleField()).toHaveValue("a".repeat(150))
    await expect(site.publishButton()).toBeEnabled()
  })

  test("notification content supports rich text formatting", async ({
    page,
  }) => {
    const site = new SitePO(page)
    const notificationTitle = "e2e rich text notification"

    // Arrange
    await site.gotoSettingsSection(siteId, "notification")
    await site.enableNotificationBanner()
    await site.expectNotificationTitleFieldVisible()
    await site.fillNotificationTitle(notificationTitle)

    // Act
    await site.notificationContentEditor().click()
    await site.notificationContentEditor().fill("Important update")
    await site.notificationContentEditor().selectText()
    await site.notificationContentToolbarButton("Bold").click()
    await site.notificationContentToolbarButton("Italicise").click()
    await site.notificationContentToolbarButton("Underline").click()

    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await site.reloadSettingsSection("notification")
    await expect(site.notificationContentEditor()).toContainText(
      "Important update",
    )
  })
})
