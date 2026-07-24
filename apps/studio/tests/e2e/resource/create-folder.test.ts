import crypto from "crypto"
import { db } from "~/server/modules/database"

import { TEST_EMAILS, storageStateFor } from "../fixtures/auth"
import { createFolderViaWizard } from "../fixtures/helpers"
import { getSeedSiteId } from "../fixtures/seed"
import { expect, test } from "../fixtures/test"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () => `E2E Test Folder ${crypto.randomUUID().slice(0, 8)}`

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  await ensureUserOnboarded(TEST_EMAILS.admin)
})

test.afterEach(async () => {
  await db
    .deleteFrom("Resource")
    .where("siteId", "=", getSeedSiteId())
    .where("title", "like", "E2E Test Folder %")
    .execute()
})

test("admin can create a folder via the Create new wizard", async ({
  page,
}) => {
  const siteId = getSeedSiteId()
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
