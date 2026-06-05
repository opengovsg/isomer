import { expect, test } from "@playwright/test"
import { sql } from "kysely"
import { db } from "~/server/modules/database"

import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"
import { SitePO } from "../fixtures/site.po"

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  // Ensure the admin user has name + phone set so the "Welcome" onboarding
  // dialog does not appear and obstruct the form. The site-settings.test.ts
  // beforeEach resets all users' profiles to empty strings.
  await db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", TEST_EMAILS.admin)
    .execute()

  // Reset both the name column and config.siteName so the test is idempotent.
  await db
    .updateTable("Site")
    .set({
      name: "Isomer",
      config: sql`jsonb_set(config, '{siteName}', '"Isomer"')`,
    })
    .where("id", "=", getSeedSiteId())
    .execute()
})

test("admin can update site name on the agency settings page", async ({
  page,
}) => {
  const site = new SitePO(page)
  await page.goto(`/sites/${getSeedSiteId()}/settings/agency`)
  await page.waitForURL(/\/settings\/agency$/)

  const nameField = page.getByLabel("Site name")
  await expect(nameField).toBeVisible()
  await nameField.fill("Isomer (renamed)")

  await site.saveButton().click()
  await site.expectSuccessToast()

  // Hard-assert persistence: reload and verify the value sticks.
  await page.reload()
  await expect(page.getByLabel("Site name")).toHaveValue("Isomer (renamed)")
})
