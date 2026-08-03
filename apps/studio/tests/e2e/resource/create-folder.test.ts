import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { createFolderViaWizard } from "~e2e/fixtures/helpers"
import { deleteResourcesByTitlePrefix } from "~e2e/fixtures/reset"
import { getResourceByTitleAndType } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

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
    await deleteResourcesByTitlePrefix(siteId, "E2E Test Folder ")
  })

  test("admin can create a folder via the Create new wizard", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE()

    // Act
    await createFolderViaWizard(page, { siteId, title })

    // Assert
    // A folder also creates an IndexPage child sharing the same title, so we
    // must scope the lookup by type to avoid matching the IndexPage.
    const created = await getResourceByTitleAndType({
      siteId,
      title,
      type: ResourceType.Folder,
    })
    expect(created).toBeTruthy()
    expect(created?.type).toBe(ResourceType.Folder)
  })
})
