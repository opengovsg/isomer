import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO } from "~e2e/fixtures/po"
import {
  seedFolder,
  seedPageInFolder,
  seedPagesInFolder,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
})

/**
 * Insertion order (oldest -> newest) is Charlie, Alpha, Bravo, and permalinks
 * are prefixed aaa/bbb/ccc, so "Recently edited", "Alphabetical", and "URL"
 * sort each yield a distinct, unambiguous row order.
 */
const seedSortableFolder = async (folderTitle: string) => {
  const { folder } = await seedFolder({ siteId, folderTitle })
  await seedPageInFolder({
    siteId,
    folderId: folder.id,
    pageTitle: "E2E Sort Charlie",
    pagePermalink: `aaa-charlie-${crypto.randomUUID().slice(0, 8)}`,
  })
  await seedPageInFolder({
    siteId,
    folderId: folder.id,
    pageTitle: "E2E Sort Alpha",
    pagePermalink: `bbb-alpha-${crypto.randomUUID().slice(0, 8)}`,
  })
  await seedPageInFolder({
    siteId,
    folderId: folder.id,
    pageTitle: "E2E Sort Bravo",
    pagePermalink: `ccc-bravo-${crypto.randomUUID().slice(0, 8)}`,
  })
  return { folder }
}

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("the folder table defaults to Recently edited sort, most-recently-updated first", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedSortableFolder(
      `E2E Sort Folder ${crypto.randomUUID().slice(0, 8)}`,
    )
    const dashboard = new DashboardPO(page)

    // Act
    await dashboard.gotoFolder(siteId, folder.id)

    // Assert
    await dashboard.expectResourceRowsInOrder([
      "E2E Sort Bravo",
      "E2E Sort Alpha",
      "E2E Sort Charlie",
    ])
  })

  test("switching the sort dropdown to Alphabetical reorders the folder table's rows", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedSortableFolder(
      `E2E Sort Folder ${crypto.randomUUID().slice(0, 8)}`,
    )
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)

    // Act
    await dashboard.sortResourceTableBy("Alphabetical")

    // Assert
    await dashboard.expectResourceRowsInOrder([
      "E2E Sort Alpha",
      "E2E Sort Bravo",
      "E2E Sort Charlie",
    ])
  })

  test("switching the sort dropdown to URL reorders the folder table's rows", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedSortableFolder(
      `E2E Sort Folder ${crypto.randomUUID().slice(0, 8)}`,
    )
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)

    // Act
    await dashboard.sortResourceTableBy("URL")

    // Assert
    await dashboard.expectResourceRowsInOrder([
      "E2E Sort Charlie",
      "E2E Sort Alpha",
      "E2E Sort Bravo",
    ])
  })

  test("pagination works across multiple pages of a folder's contents", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedFolder({
      siteId,
      folderTitle: `E2E Page Folder ${crypto.randomUUID().slice(0, 8)}`,
    })
    await seedPagesInFolder({ siteId, folderId: folder.id, count: 26 })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)
    await dashboard.sortResourceTableBy("Alphabetical")

    // Assert: page 1
    await dashboard.expectResourceRowVisible("E2E Sort Item 01")
    await dashboard.expectResourceRowHidden("E2E Sort Item 26")

    // Act
    await dashboard.goToResourceTablePage(2)

    // Assert: page 2
    await dashboard.expectResourceRowVisible("E2E Sort Item 26")
    await dashboard.expectResourceRowHidden("E2E Sort Item 01")
  })

  test("an empty folder renders the empty-state placeholder", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedFolder({
      siteId,
      folderTitle: `E2E Empty Folder ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)

    // Assert
    await dashboard.expectFolderEmptyState()
  })
})
