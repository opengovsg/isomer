import { test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { PageEditorPO } from "../fixtures/page-editor.po"
import {
  seedCollectionWithPage,
  seedFolder,
  seedRootPage,
} from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const SEARCH_PAGE_TITLE = "Search"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can search for a page and open it in the editor", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Search Target ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(pageTitle)
    await dashboard.expectSearchResultVisible(pageTitle)
    await dashboard.clickSearchResult(pageTitle)

    // Assert
    const editor = new PageEditorPO(page)
    await editor.expectLoaded()
    await dashboard.expectOnPageEditor(siteId, seededPage.id)
  })

  test("admin can search for a folder and open it on the dashboard", async ({
    page,
  }) => {
    // Arrange
    const folderTitle = `Search Folder ${crypto.randomUUID().slice(0, 8)}`
    const { folder } = await seedFolder({ siteId, folderTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(folderTitle)
    await dashboard.expectSearchResultVisible(folderTitle)
    await dashboard.clickSearchResult(folderTitle)

    // Assert
    await dashboard.expectOnFolder(siteId, folder.id)
    await dashboard.expectPageHeading(folderTitle)
  })

  test("admin can search for a collection and open it on the dashboard", async ({
    page,
  }) => {
    // Arrange
    const collectionTitle = `Search Collection ${crypto.randomUUID().slice(0, 8)}`
    const { collection } = await seedCollectionWithPage({
      siteId,
      collectionTitle,
      pageTitle: `Search Col Page ${crypto.randomUUID().slice(0, 8)}`,
    })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(collectionTitle)
    await dashboard.expectSearchResultVisible(collectionTitle)
    await dashboard.clickSearchResult(collectionTitle)

    // Assert
    await dashboard.expectOnCollection(siteId, collection.id)
    await dashboard.expectPageHeading(collectionTitle)
  })

  test("admin sees disabled delete, move, and settings on the Search system page", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openResourceMenu(SEARCH_PAGE_TITLE)

    // Assert
    await dashboard.expectSearchPageMenuItemsDisabled()
  })
})
