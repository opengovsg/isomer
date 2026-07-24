import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { createFolderViaWizard } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () => `E2E Test Folder ${crypto.randomUUID().slice(0, 8)}`

test.use({ storageState: storageStateFor("admin") })

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ admin: true })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.beforeEach(async () => {
  await ensureUserOnboarded(TEST_EMAILS.admin)
})

test.afterEach(async () => {
  await db
    .deleteFrom("Resource")
    .where("siteId", "=", siteId)
    .where("title", "like", "E2E Test Folder %")
    .execute()
})

test("admin can create a folder via the Create new wizard", async ({
  page,
}) => {
  const title = UNIQUE_TITLE()
  await createFolderViaWizard(page, { siteId, title })

  const created = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("title", "=", title)
    .select(["id", "type"])
    .executeTakeFirst()
  expect(created).toBeTruthy()
  expect(created?.type).toBe("Folder")
})
