import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { resetSiteNotification } from "../fixtures/reset"
import { getSeedSiteId } from "../fixtures/seed"
import { SitePO } from "../fixtures/site.po"
import { expect, test } from "../fixtures/test"
import { ensureUserOnboarded } from "../fixtures/user"

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  await ensureUserOnboarded(TEST_EMAILS.admin)
  await resetSiteNotification(getSeedSiteId())
})

test("admin can save a notification title", async ({ page }) => {
  const site = new SitePO(page)
  await page.goto(`/sites/${getSeedSiteId()}/settings/notification`)
  await page.waitForURL(/\/settings\/notification$/)

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
