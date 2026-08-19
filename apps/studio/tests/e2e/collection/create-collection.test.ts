import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { createCollectionViaWizard } from "../fixtures/helpers"
import { seedFolder } from "../fixtures/page-seed"
import { deleteResource, deleteResourcesByTitleLike } from "../fixtures/reset"
import { getResource, getResourceByTitle } from "../fixtures/resource.db"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () =>
  `E2E Test Collection ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteResourcesByTitleLike(siteId, "E2E Test Collection %")
  })

  test("admin can create a new collection via the wizard", async ({ page }) => {
    // Arrange
    const title = UNIQUE_TITLE()

    // Act
    const { collectionId } = await createCollectionViaWizard(page, {
      startUrl: `/sites/${siteId}`,
      title,
      siteId,
    })

    // Assert
    const created = await getResource(collectionId)
    expect(created).toBeTruthy()
    expect(created?.type).toBe("Collection")
    expect(created?.parentId).toBeNull()
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
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Create new button", async ({ page }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Assert
    await dashboard.expectCreateButtonHidden()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor does not see the Create new button", async ({ page }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Assert
    await dashboard.expectCreateButtonHidden()
  })
})

test.describe(
  "admin — create collection in a subfolder",
  {
    tag: roleTag("admin"),
  },
  () => {
    let folderId: string

    test.beforeEach(async () => {
      await ensureUserOnboarded(TEST_EMAILS.admin)
      folderId = (await seedFolder({ siteId, folderTitle: "E2E Test Folder" }))
        .folder.id
    })

    test.afterEach(async () => {
      await deleteResource(folderId)
    })

    test("admin can create a new collection inside a folder", async ({
      page,
    }) => {
      // Arrange
      const title = UNIQUE_TITLE()

      // Act
      const { collectionId } = await createCollectionViaWizard(page, {
        startUrl: `/sites/${siteId}/folders/${folderId}`,
        title,
        siteId,
      })

      // Assert
      const created = await getResource(collectionId)
      expect(created).toBeTruthy()
      expect(created?.parentId).toBe(folderId)
    })
  },
)
