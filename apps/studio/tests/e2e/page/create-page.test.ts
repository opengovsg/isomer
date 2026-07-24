import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { createPageViaWizard } from "../fixtures/helpers"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { seedFolder } from "../fixtures/page-seed"
import { getResourceByTitle } from "../fixtures/resource.db"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const UNIQUE_TITLE = () => `E2E Test Page ${crypto.randomUUID().slice(0, 8)}`

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

const deleteFolder = (folderId: string) =>
  db.deleteFrom("Resource").where("id", "=", folderId).execute()

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await db
      .deleteFrom("Resource")
      .where("siteId", "=", siteId)
      .where("title", "like", "E2E Test Page %")
      .execute()
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
    const created = await getResourceByTitle({ siteId, title })
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
      await deleteFolder(folderId)
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
      await deleteFolder(folderId)
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
      await deleteFolder(folderId)
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
