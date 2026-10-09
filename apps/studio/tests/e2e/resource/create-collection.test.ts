import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { createCollectionViaWizard } from "../fixtures/helpers"
import { seedFolder } from "../fixtures/page-seed"
import { getResource } from "../fixtures/resource.db"
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
      const created = await getResource(collectionId)
      expect(created).toBeTruthy()
      expect(created?.parentId).toBe(folderId)
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
      const created = await getResource(collectionId)
      expect(created).toBeTruthy()
      expect(created?.parentId).toBe(folderId)
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
      const created = await getResource(collectionId)
      expect(created).toBeTruthy()
      expect(created?.parentId).toBe(folderId)
    })
  },
)
