import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"

const UNIQUE_TITLE = () => `E2E Test Folder ${crypto.randomUUID().slice(0, 8)}`

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  // Welcome-modal workaround (see settings tests for rationale).
  await db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", TEST_EMAILS.admin)
    .execute()
})

test.afterEach(async () => {
  // Clean up any folders created during the test. permalink uniqueness is
  // enforced per-site, so re-runs collide unless we delete.
  await db
    .deleteFrom("Resource")
    .where("siteId", "=", getSeedSiteId())
    .where("title", "like", "E2E Test Folder %")
    .execute()
})

test("admin can create a folder via the Create new wizard", async ({
  page,
}) => {
  const title = UNIQUE_TITLE()
  await page.goto(`/sites/${getSeedSiteId()}`)

  await page.getByRole("button", { name: "Create new..." }).click()
  await page.getByRole("menuitem", { name: "Folder" }).click()

  await page.getByLabel("Folder name").fill(title)
  await page.getByRole("button", { name: "Create Folder" }).click()

  // Unlike create-page, the folder mutation does not navigate — it closes
  // the modal and shows a success toast. Wait for the toast as the signal.
  await expect(page.getByText("Folder created!")).toBeVisible()

  // Verify in DB: folder Resource row exists with type Folder.
  const created = await db
    .selectFrom("Resource")
    .where("siteId", "=", getSeedSiteId())
    .where("title", "=", title)
    .select(["id", "type"])
    .executeTakeFirst()
  expect(created).toBeTruthy()
  expect(created?.type).toBe("Folder")
})
