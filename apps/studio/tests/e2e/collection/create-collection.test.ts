import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { createCollectionViaWizard } from "~e2e/fixtures/helpers"
import { DashboardPO } from "~e2e/fixtures/po"
import {
  expectResource,
  expectResourceByTitle,
  seedFolder,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
    await expectResource(collectionId).toMatchObject({
      type: "Collection",
      parentId: null,
    })
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
    await expectResourceByTitle({ siteId, title }).toBeUndefined()
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher sees a disabled Create new button on the site root", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Assert
    await dashboard.expectCreateButtonDisabledAtSiteRoot()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor sees a disabled Create new button on the site root", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Assert
    await dashboard.expectCreateButtonDisabledAtSiteRoot()
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
      await expectResource(collectionId).toMatchObject({ parentId: folderId })
    })
  },
)

test.describe(
  "publisher — create collection in a subfolder",
  {
    tag: roleTag("publisher"),
  },
  () => {
    let folderId: string

    test.beforeEach(async () => {
      await ensureUserOnboarded(TEST_EMAILS.publisher)
      folderId = (await seedFolder({ siteId, folderTitle: "E2E Test Folder" }))
        .folder.id
    })

    test("publisher can create a new collection inside a folder", async ({
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
      await expectResource(collectionId).toMatchObject({ parentId: folderId })
    })
  },
)

test.describe(
  "editor — create collection in a subfolder",
  {
    tag: roleTag("editor"),
  },
  () => {
    let folderId: string

    test.beforeEach(async () => {
      await ensureUserOnboarded(TEST_EMAILS.editor)
      folderId = (await seedFolder({ siteId, folderTitle: "E2E Test Folder" }))
        .folder.id
    })

    test("editor can create a new collection inside a folder", async ({
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
      await expectResource(collectionId).toMatchObject({ parentId: folderId })
    })
  },
)
