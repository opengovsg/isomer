import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { createPageViaWizard } from "~e2e/fixtures/helpers"
import { DashboardPO, PageEditorPO } from "~e2e/fixtures/po"
import { deleteResourceById } from "~e2e/fixtures/reset"
import {
  getResource,
  getResourceByTitle,
  seedFolder,
} from "~e2e/fixtures/resource"
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
  let createdPageId: string | undefined

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    createdPageId = undefined
  })

  test.afterEach(async () => {
    if (createdPageId) {
      await deleteResourceById(createdPageId)
    }
  })

  test("admin can create a new page via the wizard", async ({ page }) => {
    // Arrange
    const title = UNIQUE_TITLE()

    // Act
    const { pageId } = await createPageViaWizard(page, {
      startUrl: `/sites/${siteId}`,
      title,
      siteId,
    })
    createdPageId = pageId
    await new PageEditorPO(page).expectLoaded()

    // Assert
    const created = await getResource(pageId)
    expect(created).toBeTruthy()
    expect(created?.state).toBe("Draft")
    expect(created?.type).toBe("Page")
    expect(created?.parentId).toBeNull()
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Create new button on the site homepage", async ({
    page,
  }) => {
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

  test("editor does not see the Create new button on the site homepage", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Assert
    await dashboard.expectCreateButtonHidden()
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

    test.afterEach(async () => {
      await deleteResourceById(folderId)
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
      const created = await getResourceByTitle({ siteId, title })
      expect(created).toBeTruthy()
      expect(created?.state).toBe("Draft")
      expect(created?.parentId).toBe(folderId)
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

    test.afterEach(async () => {
      await deleteResourceById(folderId)
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
      const created = await getResourceByTitle({ siteId, title })
      expect(created).toBeTruthy()
      expect(created?.state).toBe("Draft")
      expect(created?.parentId).toBe(folderId)
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

    test.afterEach(async () => {
      await deleteResourceById(folderId)
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
      const created = await getResourceByTitle({ siteId, title })
      expect(created).toBeTruthy()
      expect(created?.state).toBe("Draft")
      expect(created?.parentId).toBe(folderId)
    })
  },
)
