import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO } from "~e2e/fixtures/po"
import {
  seedCollectionWithPage,
  seedFolderWithChildPage,
  seedNestedFolder,
  seedPageInFolder,
} from "~e2e/fixtures/resource"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("sidebar expands a collapsed folder node to reveal its child page", async ({
    page,
  }) => {
    // Arrange
    const { folder, childPage } = await seedFolderWithChildPage({ siteId })
    const folderLabel = `/${folder.permalink}`
    const childLabel = `/${childPage.permalink}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.expectSidebarItemCollapsed(folderLabel)
    await dashboard.expectSidebarItemHidden(childLabel)

    // Act
    await dashboard.toggleSidebarItem(folderLabel)

    // Assert
    await dashboard.expectSidebarItemExpanded(folderLabel)
    await dashboard.expectSidebarItemVisible(childLabel)
  })

  test("sidebar collapses an expanded folder node to hide its child page", async ({
    page,
  }) => {
    // Arrange
    const { folder, childPage } = await seedFolderWithChildPage({ siteId })
    const folderLabel = `/${folder.permalink}`
    const childLabel = `/${childPage.permalink}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.toggleSidebarItem(folderLabel)
    await dashboard.expectSidebarItemExpanded(folderLabel)

    // Act
    await dashboard.toggleSidebarItem(folderLabel)

    // Assert
    await dashboard.expectSidebarItemCollapsed(folderLabel)
    await dashboard.expectSidebarItemHidden(childLabel)
  })

  test("sidebar expands a collection node to reveal its collection page", async ({
    page,
  }) => {
    // Arrange
    const { collection, collectionPage } = await seedCollectionWithPage({
      siteId,
    })
    const collectionLabel = `/${collection.permalink}`
    const itemLabel = `/${collectionPage.permalink}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.expectSidebarItemCollapsed(collectionLabel)
    await dashboard.expectSidebarItemHidden(itemLabel)

    // Act
    await dashboard.toggleSidebarItem(collectionLabel)

    // Assert
    await dashboard.expectSidebarItemExpanded(collectionLabel)
    await dashboard.expectSidebarItemVisible(itemLabel)
  })

  test("the currently open folder is highlighted active and auto-expanded in the sidebar", async ({
    page,
  }) => {
    // Arrange
    const { folder: activeFolder, childPage } = await seedFolderWithChildPage({
      siteId,
      folderTitle: "E2E Active Folder",
    })
    const { folder: otherFolder } = await seedFolderWithChildPage({
      siteId,
      folderTitle: "E2E Other Folder",
    })
    const activeLabel = `/${activeFolder.permalink}`
    const otherLabel = `/${otherFolder.permalink}`
    const childLabel = `/${childPage.permalink}`
    const dashboard = new DashboardPO(page)

    // Act
    await dashboard.gotoFolder(siteId, activeFolder.id)

    // Assert: active folder highlighted and auto-expanded, sibling is not
    await dashboard.expectSidebarItemActive(activeLabel)
    await dashboard.expectSidebarItemExpanded(activeLabel)
    await dashboard.expectSidebarItemVisible(childLabel)
    await dashboard.expectSidebarItemInactive(otherLabel)
    await dashboard.expectSidebarItemCollapsed(otherLabel)
  })

  test("breadcrumb renders a link per ancestor, with the current segment not a link", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedFolderWithChildPage({
      siteId,
      folderTitle: "E2E Breadcrumb Folder",
    })
    const dashboard = new DashboardPO(page)

    // Act
    await dashboard.gotoFolder(siteId, folder.id)

    // Assert
    await dashboard.expectBreadcrumbLinkVisible("Home")
    await dashboard.expectBreadcrumbCurrentText("E2E Breadcrumb Folder")
  })

  test("clicking a breadcrumb segment navigates to that ancestor", async ({
    page,
  }) => {
    // Arrange
    const { folder } = await seedFolderWithChildPage({
      siteId,
      folderTitle: "E2E Breadcrumb Nav Folder",
    })
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, folder.id)

    // Act
    await dashboard.clickBreadcrumb("Home")

    // Assert
    await dashboard.expectOnSiteDashboard(siteId)
  })

  test("multi-level nested navigation (folder -> subfolder -> page) via the sidebar lands on the correct page", async ({
    page,
  }) => {
    // Arrange
    const { parentFolder, childFolder } = await seedNestedFolder({
      siteId,
      parentFolderTitle: "E2E Sidebar Nav Parent",
      childFolderTitle: "E2E Sidebar Nav Child",
    })
    const { page: nestedPage } = await seedPageInFolder({
      siteId,
      folderId: childFolder.id,
      pageTitle: "E2E Sidebar Nav Page",
    })
    const parentLabel = `/${parentFolder.permalink}`
    const childLabel = `/${childFolder.permalink}`
    const pageLabel = `/${nestedPage.permalink}`

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.toggleSidebarItem(parentLabel)
    await dashboard.expectSidebarItemVisible(childLabel)
    await dashboard.toggleSidebarItem(childLabel)
    await dashboard.expectSidebarItemVisible(pageLabel)

    // Act
    await dashboard.clickSidebarItem(pageLabel)

    // Assert
    await dashboard.expectOnPageEditor(siteId, nestedPage.id)
  })

  test("multi-level nested navigation (folder -> subfolder -> page) via breadcrumbs lands on the correct ancestor", async ({
    page,
  }) => {
    // Arrange
    const { parentFolder, childFolder } = await seedNestedFolder({
      siteId,
      parentFolderTitle: "E2E Breadcrumb Nav Parent",
      childFolderTitle: "E2E Breadcrumb Nav Child",
    })
    const dashboard = new DashboardPO(page)
    await dashboard.gotoFolder(siteId, childFolder.id)
    await dashboard.expectBreadcrumbLinkVisible("Home")
    await dashboard.expectBreadcrumbLinkVisible("E2E Breadcrumb Nav Parent")
    await dashboard.expectBreadcrumbCurrentText("E2E Breadcrumb Nav Child")

    // Act
    await dashboard.clickBreadcrumb("E2E Breadcrumb Nav Parent")

    // Assert
    await dashboard.expectOnFolder(siteId, parentFolder.id)
  })
})
