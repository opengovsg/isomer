import { test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO, PageEditorPO } from "~e2e/fixtures/po"
import {
  seedCollectionWithPage,
  seedFolder,
  seedFolderWithPage,
  seedRootPage,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const SEARCH_PAGE_TITLE = "Search"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
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

  test("admin can search for a collection page and open it in the editor", async ({
    page,
  }) => {
    // Arrange
    const collectionPageTitle = `Search Col Item ${crypto.randomUUID().slice(0, 8)}`
    const { collectionPage } = await seedCollectionWithPage({
      siteId,
      collectionTitle: `Search Item Collection ${crypto.randomUUID().slice(0, 8)}`,
      pageTitle: collectionPageTitle,
    })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(collectionPageTitle)
    await dashboard.expectSearchResultVisible(collectionPageTitle)
    await dashboard.clickSearchResult(collectionPageTitle)

    // Assert
    const editor = new PageEditorPO(page)
    await editor.expectLoaded()
    await dashboard.expectOnPageEditor(siteId, collectionPage.id)
  })

  test("admin can search for a nested page and open it in the editor", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Search Nested ${crypto.randomUUID().slice(0, 8)}`
    const { page: nestedPage } = await seedFolderWithPage({
      siteId,
      pageTitle,
    })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(pageTitle)
    await dashboard.expectSearchResultVisible(pageTitle)
    await dashboard.clickSearchResult(pageTitle)

    // Assert
    const editor = new PageEditorPO(page)
    await editor.expectLoaded()
    await dashboard.expectOnPageEditor(siteId, nestedPage.id)
  })

  test("admin does not list the Search system page on the site dashboard", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Assert
    await dashboard.expectResourceLinkHidden(SEARCH_PAGE_TITLE)
  })

  test("an empty-match query renders the no-results state", async ({
    page,
  }) => {
    // Arrange / Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(`No Match ${crypto.randomUUID()}`)

    // Assert
    await dashboard.expectNoSearchResults()
  })

  test("a same-titled resource in another site never appears when searching from this site", async ({
    page,
  }) => {
    // Arrange
    const otherSite = await provisionE2ESite({ roles: [RoleType.Admin] })
    const sharedTitle = `Search Shared ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle: sharedTitle })
    await seedRootPage({ siteId: otherSite.siteId, pageTitle: sharedTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(sharedTitle)

    // Assert
    await dashboard.expectSearchResultCount(1)
    await dashboard.expectSearchResultVisible(sharedTitle)
  })

  test("Cmd/Ctrl+K opens the search modal", async ({ page }) => {
    // Arrange
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)

    // Act / Assert
    await dashboard.openSearchViaShortcut()
  })

  test("Escape closes the search modal and returns focus to the search trigger", async ({
    page,
  }) => {
    // Arrange
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openSearch()

    // Act
    await dashboard.closeSearchViaEscape()

    // Assert
    await dashboard.expectSearchTriggerFocused()
  })

  test("browser back after opening a search result returns to the prior dashboard page, without reopening search", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Search Back ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle })
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(pageTitle)
    await dashboard.clickSearchResult(pageTitle)

    const editor = new PageEditorPO(page)
    await editor.expectLoaded()

    // Act
    await dashboard.goBack()

    // Assert
    await dashboard.expectOnSiteDashboard(siteId)
    await dashboard.expectSearchModalClosed()
  })

  test("a just-edited page appears under Pages recently edited on your site", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Search Recent Edit ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle })

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openSearch()

    // Assert
    await dashboard.expectRecentlyEditedSearchResult(pageTitle)
  })

  test("a previously visited page appears under Pages you've recently opened", async ({
    page,
  }) => {
    // Arrange
    const pageTitle = `Search Recent View ${crypto.randomUUID().slice(0, 8)}`
    const { page: seededPage } = await seedRootPage({ siteId, pageTitle })

    const editor = new PageEditorPO(page)
    await editor.gotoPage(siteId, seededPage.id)
    await editor.expectLoaded()

    // Act
    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.openSearch()

    // Assert
    await dashboard.expectRecentlyViewedSearchResult(pageTitle)
  })
})
