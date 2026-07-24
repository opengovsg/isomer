import { expect, test } from "@playwright/test"

import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { resetSiteAgencySettings } from "../fixtures/reset"
import { getSeedSiteId } from "../fixtures/seed"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  await ensureUserOnboarded(TEST_EMAILS.admin)
  await resetSiteAgencySettings(getSeedSiteId())
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

  await site.publishButton().click()
  await site.expectChangesPublishedToast()

  await page.reload()
  await expect(page.getByLabel("Site name")).toHaveValue("Isomer (renamed)")
})

test.describe("publisher", () => {
  test.use({ storageState: storageStateFor("publisher") })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Publish button on agency settings", async ({
    page,
  }) => {
    await page.goto(`/sites/${getSeedSiteId()}/settings/agency`)
    await page.waitForURL(/\/settings\/agency$/)

    await expect(page.getByLabel("Site name")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Publish" }),
    ).not.toBeVisible()
  })
})
