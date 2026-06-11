import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"

const UNIQUE_TITLE = () => `E2E Test Page ${crypto.randomUUID().slice(0, 8)}`

test.describe("admin", () => {
  test.use({ storageState: storageStateFor("admin") })

  test.beforeEach(async () => {
    // Same welcome-modal workaround as the settings tests.
    await db
      .updateTable("User")
      .set({ name: "test-e2e", phone: "82345678" })
      .where("email", "=", TEST_EMAILS.admin)
      .execute()
  })

  test.afterEach(async () => {
    // Remove any pages whose title starts with "E2E Test Page" so subsequent
    // runs don't accumulate state. permalink uniqueness is enforced per-site,
    // and the create flow auto-derives permalink from title — using a unique
    // title per run side-steps conflicts, but we still clean up afterwards.
    await db
      .deleteFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "like", "E2E Test Page %")
      .execute()
  })

  test("admin can create a new page via the wizard", async ({ page }) => {
    const title = UNIQUE_TITLE()
    await page.goto(`/sites/${getSeedSiteId()}`)

    await page.getByRole("button", { name: "Create new..." }).click()
    await page.getByRole("menuitem", { name: "Page" }).click()

    // Layout screen: keep the default layout and proceed.
    await page.getByRole("button", { name: "Next: Page title and URL" }).click()

    // Details screen: title auto-fills the URL.
    await page.getByLabel("Page title").fill(title)
    await page.getByRole("button", { name: "Start editing" }).click()

    // Router pushes to /sites/{siteId}/pages/{pageId}.
    await page.waitForURL(new RegExp(`/sites/${getSeedSiteId()}/pages/\\d+$`))

    // Verify in DB the page was created with the expected title + Draft state.
    const created = await db
      .selectFrom("Resource")
      .where("siteId", "=", getSeedSiteId())
      .where("title", "=", title)
      .select(["id", "state", "type"])
      .executeTakeFirst()
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
  })
})

test.describe("publisher", () => {
  test.use({ storageState: storageStateFor("publisher") })

  test.beforeEach(async () => {
    await db
      .updateTable("User")
      .set({ name: "test-e2e", phone: "82345678" })
      .where("email", "=", TEST_EMAILS.publisher)
      .execute()
  })

  test("publisher does not see the Create new button", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}`)
    // Site content table is visible (page rendered) but the create menu is
    // gated by `<Can do="create">` and absent for publishers.
    await expect(
      page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  })
})
