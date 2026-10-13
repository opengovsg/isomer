import { test } from "@playwright/test"
import crypto from "crypto"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { createPageViaWizard } from "~e2e/fixtures/helpers"
import { DashboardPO, PageEditorPO } from "~e2e/fixtures/po"
import { expectResourceByTitle, seedFolder } from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const UNIQUE_TITLE = () => `E2E Test Page ${crypto.randomUUID().slice(0, 8)}`

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

  test("admin can create a new page via the wizard", async ({ page }) => {
    // Arrange
    const title = UNIQUE_TITLE()

    // Act
    await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}`,
      title,
      siteId,
    })
    await new PageEditorPO(page).expectLoaded()

    // Assert
    await expectResourceByTitle({ siteId, title }).toMatchObject({
      state: "Draft",
      type: "Page",
      parentId: null,
    })
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
  "admin — create page in a subfolder",
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

    test("admin can create a new page inside a folder", async ({ page }) => {
      // Arrange
      const title = UNIQUE_TITLE()

      // Act
      await createPageViaWizard(page, {
        startUrl: `/sites/${siteId}/folders/${folderId}`,
        title,
        siteId,
      })

      // Assert
      await expectResourceByTitle({ siteId, title }).toMatchObject({
        state: "Draft",
        parentId: folderId,
      })
    })
  },
)

test.describe(
  "publisher — create page in a subfolder",
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

    test("publisher can create a new page inside a folder", async ({
      page,
    }) => {
      // Arrange
      const title = UNIQUE_TITLE()

      // Act
      await createPageViaWizard(page, {
        startUrl: `/sites/${siteId}/folders/${folderId}`,
        title,
        siteId,
      })

      // Assert
      await expectResourceByTitle({ siteId, title }).toMatchObject({
        state: "Draft",
        parentId: folderId,
      })
    })
  },
)

test.describe(
  "editor — create page in a subfolder",
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

    test("editor can create a new page inside a folder", async ({ page }) => {
      // Arrange
      const title = UNIQUE_TITLE()

      // Act
      await createPageViaWizard(page, {
        startUrl: `/sites/${siteId}/folders/${folderId}`,
        title,
        siteId,
      })

      // Assert
      await expectResourceByTitle({ siteId, title }).toMatchObject({
        state: "Draft",
        parentId: folderId,
      })
    })
  },
)
