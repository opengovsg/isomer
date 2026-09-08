import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { createFolderViaWizard } from "../fixtures/helpers"
import { deleteResourcesByTitleLike } from "../fixtures/reset"
import { getResource } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () => `E2E Test Folder ${crypto.randomUUID().slice(0, 8)}`

test.describe("create folder", { tag: roleTag("admin") }, () => {
  let siteId: number

  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteResourcesByTitleLike(siteId, "E2E Test Folder %")
  })

  test("admin can create a folder via the Create new wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE()

    // Act
    const { folderId } = await createFolderViaWizard(page, { siteId, title })

    // Assert
    const created = await getResource(folderId)
    expect(created).toBeTruthy()
    expect(created?.type).toBe("Folder")
  })
})
