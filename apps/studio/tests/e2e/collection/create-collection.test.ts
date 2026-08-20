import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { createCollectionViaWizard } from "~e2e/fixtures/helpers"
import { DashboardPO } from "~e2e/fixtures/po"
import { deleteResourceById } from "~e2e/fixtures/reset"
import {
  getResource,
  getResourceByTitle,
  getResourceByTitleAndType,
  seedFolder,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { ResourceType, RoleType } from "~prisma/generated/generatedEnums"

const UNIQUE_TITLE = () =>
  `E2E Test Collection ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  let createdCollectionId: string | undefined

  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    createdCollectionId = undefined
  })

  test.afterEach(async () => {
    if (createdCollectionId) {
      await deleteResourceById(createdCollectionId)
    }
  })

  test("admin can create a collection via the Create new wizard", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()

    // Arrange / Act
    await createCollectionViaWizard(page, { siteId, title })

    // Assert
    // NOTE: creating a collection also creates an IndexPage child with the
    // same title, so we must filter by type to find the collection itself.
    const created = await getResourceByTitleAndType({
      siteId,
      title,
      type: ResourceType.Collection,
    })
    expect(created).toBeTruthy()
    expect(created?.type).toBe("Collection")
    createdCollectionId = created?.id
  })

  test("admin can close the create collection modal without creating a collection", async ({
    page,
  }) => {
    const title = UNIQUE_TITLE()
    const dashboard = new DashboardPO(page)

    // Arrange
    await dashboard.gotoSite(siteId)

    // Act
    await dashboard.openCreateCollectionModal()
    await dashboard.fillCreateCollectionModalTitle(title)
    await dashboard.cancelCreateCollectionModal()

    // Assert
    const created = await getResourceByTitle({ siteId, title })
    expect(created).toBeUndefined()
  })

  test("admin can create a new collection inside a folder", async ({
    page,
  }) => {
    // Arrange
    const title = UNIQUE_TITLE()
    const { folder } = await seedFolder({
      siteId,
      folderTitle: "E2E Test Folder",
    })

    try {
      // Act
      const { collectionId } = await createCollectionViaWizard(page, {
        startUrl: `/sites/${siteId}/folders/${folder.id}`,
        title,
        siteId,
      })

      // Assert
      const created = await getResource(collectionId)
      expect(created).toBeTruthy()
      expect(created?.type).toBe("Collection")
      expect(created?.parentId).toBe(folder.id)
    } finally {
      await deleteResourceById(folder.id)
    }
  })
})
