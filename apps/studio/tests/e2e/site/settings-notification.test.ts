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
    await site.gotoSettings(siteId, "notification")

    const toggleLabel = page.locator(".chakra-switch")
    await expect(toggleLabel).toBeVisible()
    await toggleLabel.click()

    const titleField = page.getByLabel("Notification title")
    await expect(titleField).toBeVisible({ timeout: 5000 })
    await titleField.fill("e2e test notification")

    await site.publishButton().click()
    await site.expectChangesPublishedToast()

    await page.reload()
    await page.waitForURL(/\/settings\/notification$/)
    const reloadedCheckbox = page.getByRole("checkbox")
    await expect(reloadedCheckbox).toBeChecked()
    await expect(page.getByLabel("Notification title")).toHaveValue(
      "e2e test notification",
    )
  })
})
