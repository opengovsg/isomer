import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { createFolderViaWizard } from "~e2e/fixtures/helpers"
import { getResource } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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

  test("admin can create a folder via the Create new wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE()

    // Act
    const { folderId } = await createFolderViaWizard(page, { siteId, title })

    // Assert. A folder and its index page share this title, so look up the
    // folder the wizard returned instead of the first row with that title.
    const created = await getResource(folderId)
    expect(created?.type).toBe("Folder")
  })
})
