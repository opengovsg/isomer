import { expect, test } from "@playwright/test"
import { sql } from "kysely"
import { db } from "~/server/modules/database"

import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"
import { SitePO } from "../fixtures/site.po"

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  // Ensure the admin user has name + phone set so the "Welcome" onboarding
  // dialog does not appear and obstruct the form.
  await db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", TEST_EMAILS.admin)
    .execute()

  // Reset the notification on the seed site so the test starts from a clean
  // state (toggle off). The `-` operator removes a key from a JSONB column.
  await db
    .updateTable("Site")
    .set({ config: sql`config - 'notification'` })
    .where("id", "=", getSeedSiteId())
    .execute()
})

test("admin can save a notification title", async ({ page }) => {
  const site = new SitePO(page)
  await page.goto(`/sites/${getSeedSiteId()}/settings/notification`)
  await page.waitForURL(/\/settings\/notification$/)

  // The notification object is optional. FormBuilder renders optional objects
  // with a Switch (Chakra UI). The Switch renders a <label> wrapping a hidden
  // <input type="checkbox">. The label intercepts pointer events, so we click
  // the label (.chakra-switch) rather than the underlying input.
  const toggleLabel = page.locator(".chakra-switch")
  await expect(toggleLabel).toBeVisible()
  await toggleLabel.click()

  // After toggling on, the "Notification title" input should appear.
  const titleField = page.getByLabel("Notification title")
  await expect(titleField).toBeVisible({ timeout: 5000 })
  await titleField.fill("e2e test notification")

  await site.saveButton().click()
  await site.expectSuccessToast()

  // Stretch: reload and confirm persistence.
  await page.reload()
  await page.waitForURL(/\/settings\/notification$/)
  // After reload, the toggle should still be checked (notification persisted).
  const reloadedCheckbox = page.getByRole("checkbox")
  await expect(reloadedCheckbox).toBeChecked()
  await expect(page.getByLabel("Notification title")).toHaveValue(
    "e2e test notification",
  )
})
