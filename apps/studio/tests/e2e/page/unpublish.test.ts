import { expect, test } from "@playwright/test"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"
import { createPublishedPage, deleteResourceById } from "../fixtures/unpublish"

// The welcome modal blocks the editor until the user has a name + phone.
const dismissWelcomeModal = (email: string) =>
  db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()

const publishedVersionIdOf = (pageId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", pageId)
    .select("publishedVersionId")
    .executeTakeFirst()
    .then((r) => r?.publishedVersionId ?? null)

test.describe("admin — unpublish now", () => {
  test.use({ storageState: storageStateFor("admin") })

  let pageId: string

  test.beforeEach(async () => {
    await dismissWelcomeModal(TEST_EMAILS.admin)
    pageId = (await createPublishedPage()).id
  })

  test.afterEach(async () => {
    await deleteResourceById(pageId)
  })

  test("admin can unpublish a live page immediately", async ({ page }) => {
    await page.goto(`/sites/${getSeedSiteId()}/pages/${pageId}`)

    await page.getByRole("button", { name: "More actions" }).click()
    await page.getByRole("button", { name: "Unpublish page" }).click()

    // No default mode on this branch, so pick "now" explicitly by clicking its
    // option card (the radio input itself is visually hidden inside the label).
    await page.locator("label").filter({ hasText: "Unpublish now" }).click()
    await page.getByRole("button", { name: "Unpublish now" }).click()

    await expect(
      page.getByText("Page unpublished successfully"),
    ).toBeVisible()

    // The page is no longer live once unpublished.
    await expect.poll(() => publishedVersionIdOf(pageId)).toBeNull()
  })
})
