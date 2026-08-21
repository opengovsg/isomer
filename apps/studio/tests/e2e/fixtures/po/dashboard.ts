import { expect, type Page } from "@playwright/test"

export class DashboardPO {
  constructor(private readonly page: Page) {}

  async gotoSite(siteId: number) {
    await this.page.goto(`/sites/${siteId}`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}$`))
  }

  async gotoFolder(siteId: number, folderId: string) {
    await this.page.goto(`/sites/${siteId}/folders/${folderId}`)
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/folders/${folderId}$`),
    )
  }

  async openCreateMenu() {
    await this.page.getByRole("button", { name: "Create new..." }).click()
  }

  async expectHomepageRowVisible() {
    await expect(
      this.page.getByRole("link", { name: "Home Published" }),
    ).toBeVisible()
  }

  async expectCreateButtonVisible() {
    await expect(
      this.page.getByRole("button", { name: "Create new..." }),
    ).toBeVisible()
  }

  async expectCreateButtonHidden() {
    await expect(
      this.page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  }

  async expectCreateMenuHidden() {
    await this.expectCreateButtonHidden()
  }

  async openCreateCollectionModal() {
    await this.openCreateMenu()
    await this.clickCreateCollection()
    await expect(this.page.getByText("Create a new collection")).toBeVisible()
  }

  async fillCreateCollectionModalTitle(title: string) {
    await this.page.getByLabel("Collection name").fill(title)
  }

  async cancelCreateCollectionModal() {
    // The modal has two "Close"-named buttons: the icon-only `ModalCloseButton`
    // (aria-label only, no visible text) and this footer action button. Filter
    // by visible text to target the footer button specifically.
    await this.page
      .getByRole("button", { name: "Close" })
      .filter({ hasText: "Close" })
      .click()
    await expect(
      this.page.getByText("Create a new collection"),
    ).not.toBeVisible()
  }

  async openCollectionItemWizard() {
    await this.clickAddCollectionItem()
    await expect(
      this.page.getByText("What kind of collection item are you creating?"),
    ).toBeVisible()
  }

  async cancelCollectionItemWizard() {
    await this.page.getByRole("button", { name: "Cancel" }).click()
    await expect(
      this.page.getByText("What kind of collection item are you creating?"),
    ).not.toBeVisible()
  }

  async openResourceMenu(title: string) {
    await this.page
      .getByRole("button", { name: `Options for ${title}`, exact: true })
      .click()
  }

  async clickCreatePage() {
    await this.page.getByRole("menuitem", { name: "Page" }).click()
  }

  async clickCreateFolder() {
    await this.page.getByRole("menuitem", { name: "Folder" }).click()
  }

  async clickCreateCollection() {
    await this.page.getByRole("menuitem", { name: "Collection" }).click()
  }

  async fillPageWizard(title: string) {
    await this.page
      .getByRole("button", { name: "Next: Page title and URL" })
      .click()
    await this.page.getByLabel("Page title").fill(title)
    await this.page.getByRole("button", { name: "Start editing" }).click()
  }

  async fillFolderWizard(title: string) {
    await this.page.getByLabel("Folder name").fill(title)
    await this.page.getByRole("button", { name: "Create Folder" }).click()
    await expect(this.page.getByText("Folder created!")).toBeVisible()
  }

  async fillCollectionWizard(title: string) {
    await this.page.getByLabel("Collection name").fill(title)
    await this.page.getByRole("button", { name: "Create collection" }).click()
    await expect(this.page.getByText("Collection created!")).toBeVisible()
  }

  async openPageSettings(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible()
    await this.openResourceMenu(title)
    await this.page.getByRole("menuitem", { name: "Edit settings" }).click()
  }

  async expectScheduledBadge(title: string) {
    const row = this.page.getByRole("row").filter({ hasText: title })
    await expect(row.getByText("Scheduled")).toBeVisible()
  }

  async openAddCollectionItem() {
    await this.page.getByRole("button", { name: "Add new item" }).click()
  }

  async clickAddCollectionItem() {
    await this.openAddCollectionItem()
  }

  async selectCollectionItemType(type: "Page" | "Link or file") {
    await this.page.getByText(type, { exact: true }).click()
  }

  async proceedToCollectionItemDetails() {
    await this.page.getByRole("button", { name: "Next: Page details" }).click()
  }

  async fillCollectionItemWizard(title: string) {
    await this.page.getByLabel(/Page title|Item title/).fill(title)
    await this.page.getByRole("button", { name: "Start editing" }).click()
  }

  async fillCollectionPageWizard(title: string) {
    await this.page.getByLabel("Page title").fill(title)
    await this.page.getByRole("button", { name: "Start editing" }).click()
  }

  async fillCollectionLinkWizard(title: string) {
    await this.page.getByLabel("Item title").fill(title)
    await this.page.getByRole("button", { name: "Start editing" }).click()
  }

  async gotoCollection(siteId: number, collectionId: string) {
    await this.page.goto(`/sites/${siteId}/collections/${collectionId}`)
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/collections/${collectionId}$`),
    )
  }

  async expectCollectionAccessDenied() {
    await expect(
      this.page.getByText("You don't have access to edit this collection."),
    ).toBeVisible()
    await expect(
      this.page.getByRole("button", { name: "Back to My Sites" }),
    ).toBeVisible()
  }

  /** Collection table uses the same options menu as the resource table. */
  async openCollectionResourceMenu(title: string) {
    await this.openResourceMenu(title)
  }

  async clickDelete() {
    await this.page
      .getByRole("menuitem", { name: "Delete", exact: true })
      .click()
  }

  async clickMove() {
    const moveByVisibleText = this.page.getByRole("menuitem", {
      name: "Move to...",
    })
    const moveByAriaLabel = this.page.getByRole("menuitem", {
      name: /Move resource to another location for/,
    })
    await moveByAriaLabel.or(moveByVisibleText).click()
  }

  async expectDeleteMenuDisabled() {
    await expect(
      this.page.getByRole("menuitem", { name: "Delete", exact: true }),
    ).toBeDisabled()
  }

  async expectMoveMenuDisabled() {
    const moveByVisibleText = this.page.getByRole("menuitem", {
      name: "Move to...",
    })
    const moveByAriaLabel = this.page.getByRole("menuitem", {
      name: /Move resource to another location for/,
    })
    await expect(moveByAriaLabel.or(moveByVisibleText)).toBeDisabled()
  }

  async expectResourceLinkVisible(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible()
  }

  async expectResourceLinkHidden(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toHaveCount(0)
  }

  async expectPageHeading(title: string) {
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible()
  }

  async expectOnPageEditor(siteId: number, pageId: string) {
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/pages/${pageId}`))
  }

  async capturePageEditorIdFromUrl(siteId: number) {
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/pages/\\d+$`))
    const pageId = this.page.url().match(/\/pages\/(\d+)$/)?.[1]
    if (!pageId) {
      throw new Error(
        `Expected page editor URL after wizard, got ${this.page.url()}`,
      )
    }
    return pageId
  }

  async captureCollectionItemIdFromUrl(
    siteId: number,
    type: "Page" | "Link or file",
  ) {
    const subpath = type === "Page" ? "pages" : "links"
    const pattern = new RegExp(`/sites/${siteId}/${subpath}/(\\d+)$`)
    await this.page.waitForURL(pattern)
    const itemId = this.page.url().match(pattern)?.[1]
    if (!itemId) {
      throw new Error(
        `Expected ${subpath} URL after wizard, got ${this.page.url()}`,
      )
    }
    return itemId
  }

  async expectOnFolder(siteId: number, folderId: string) {
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/folders/${folderId}$`),
    )
  }

  async expectOnCollection(siteId: number, collectionId: string) {
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/collections/${collectionId}$`),
    )
  }

  async expectSearchResultVisible(title: string) {
    const dialog = this.page.getByRole("dialog")
    await expect(dialog.getByText(/\d+ search result.*in title/i)).toBeVisible()
    await expect(dialog.getByRole("link", { name: title })).toBeVisible()
  }

  async openFolderSettings(title: string) {
    await this.openResourceMenu(title)
    await this.page
      .getByRole("menuitem", { name: "Edit folder settings" })
      .click()
  }

  async confirmDeleteResource(
    label: "page" | "folder" | "collection",
    { title }: { title: string },
  ) {
    await expect(
      this.page.getByRole("dialog").getByText(`Delete ${title}?`),
    ).toBeVisible()
    await this.page
      .getByRole("dialog")
      .getByText(new RegExp(`Yes, delete this ${label} permanently`))
      .click()
    await this.page.getByRole("button", { name: `Delete ${label}` }).click()
    await expect(
      this.page.getByText(new RegExp(`${label} deleted!`, "i")),
    ).toBeVisible()
  }

  async cancelDeleteResource(
    label: "page" | "folder" | "collection",
    { title }: { title: string },
  ) {
    await expect(
      this.page.getByRole("dialog").getByText(`Delete ${title}?`),
    ).toBeVisible()
    await this.page.getByRole("button", { name: `No, keep ${label}` }).click()
    await expect(
      this.page.getByRole("dialog").getByText(`Delete ${title}?`),
    ).not.toBeVisible()
  }

  async selectMoveDestination(title: string) {
    await expect(
      this.page.getByRole("dialog").getByText(/Move ".+" to\.\.\./),
    ).toBeVisible()
    await this.page.getByRole("button").filter({ hasText: title }).click()
  }

  /**
   * First click selects the folder; second click enters it so
   * "Back to parent folder" appears. Needed before selectMoveToSiteRoot —
   * ResourceSelector starts at "/" visually but curResourceId stays
   * undefined until the user navigates, and Back is what calls onChange(null).
   */
  async enterMoveFolder(title: string) {
    await this.selectMoveDestination(title)
    await this.selectMoveDestination(title)
  }

  async uncheckCreateRedirectOnMove() {
    // Chakra renders the native checkbox visually hidden behind its styled
    // label, which intercepts pointer events — click the label's own text
    // (as `confirmDeleteResource` does for its confirmation checkbox) rather
    // than the checkbox role directly.
    await this.page.getByText(/Check this box to.*redirect/i).click()
  }

  async confirmMove() {
    const moveButton = this.page.getByRole("button", { name: "Move here" })
    await expect(moveButton).toBeEnabled()
    await moveButton.click()
    await expect(this.page.getByText("Resource moved!")).toBeVisible()
  }

  async cancelMove() {
    await this.page.getByRole("button", { name: "Cancel", exact: true }).click()
    await expect(
      this.page.getByRole("dialog").getByText(/Move ".+" to\.\.\./),
    ).not.toBeVisible()
  }

  async selectMoveToSiteRoot() {
    const backButton = this.page.getByRole("button", {
      name: "Back to parent folder",
    })
    while (await backButton.isVisible()) {
      await backButton.click()
    }
  }

  async openSearch() {
    await this.page.getByRole("button", { name: "search-button" }).click()
    await expect(
      this.page.getByPlaceholder(
        /Search pages, collections, or folders by name/,
      ),
    ).toBeVisible()
  }

  async searchFor(query: string) {
    await this.openSearch()
    await this.page
      .getByPlaceholder(/Search pages, collections, or folders by name/)
      .fill(query)
  }

  async clickSearchResult(title: string) {
    const dialog = this.page.getByRole("dialog")
    await expect(dialog.getByText(/\d+ search result.*in title/i)).toBeVisible()
    const resultLink = dialog.getByRole("link", { name: title })
    await expect(resultLink).toBeVisible()
    await resultLink.click()
  }

  async sortCollectionBy(label: "Recently edited" | "Alphabetical" | "URL") {
    await this.page
      .getByRole("button", { name: /Recently edited|Alphabetical|URL/ })
      .click()
    await this.page.getByRole("menuitem", { name: label }).click()
  }

  async expectCollectionItemCount(count: number) {
    const noun = count === 1 ? "item" : "items"
    await expect(this.page.getByText(`${count} ${noun}`)).toBeVisible()
  }

  async expectCollectionRowVisible(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible()
  }

  async expectCollectionRowHidden(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toHaveCount(0)
  }

  async expectCollectionRowsInOrder(titles: string[]) {
    const links = this.page.getByRole("link").filter({
      hasText: new RegExp(
        titles
          .map((title) => title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|"),
      ),
    })
    await expect(links).toHaveCount(titles.length)
    for (const [index, title] of titles.entries()) {
      await expect(links.nth(index)).toHaveText(title)
    }
  }

  async goToCollectionTablePage(pageNumber: number) {
    const nav = this.page.getByRole("navigation", { name: "Pagination" })
    await expect(nav).toBeVisible()
    await nav
      .getByRole("button", { name: String(pageNumber), exact: true })
      .click()
  }

  /** Folder ResourceTable shares its sort menu with the collection table. */
  async sortResourceTableBy(label: "Recently edited" | "Alphabetical" | "URL") {
    await this.sortCollectionBy(label)
  }

  /** Folder ResourceTable shares its pagination component with the collection table. */
  async goToResourceTablePage(pageNumber: number) {
    await this.goToCollectionTablePage(pageNumber)
  }

  async expectResourceRowsInOrder(titles: string[]) {
    await this.expectCollectionRowsInOrder(titles)
  }

  async expectResourceRowVisible(title: string) {
    await this.expectCollectionRowVisible(title)
  }

  async expectResourceRowHidden(title: string) {
    await this.expectCollectionRowHidden(title)
  }

  async expectFolderEmptyState() {
    await expect(
      this.page.getByText("This folder is empty. Create a new page or folder"),
    ).toBeVisible()
  }

  async expectSiteAccessDenied() {
    await expect(
      this.page.getByText("You don't have access to edit this site."),
    ).toBeVisible()
    await expect(
      this.page.getByRole("button", { name: "Back to My Sites" }),
    ).toBeVisible()
  }

  async openSearchViaShortcut() {
    await expect(
      this.page.getByRole("button", { name: "search-button" }),
    ).toBeVisible()
    const shortcut = await this.page.evaluate(() =>
      (navigator.userAgent || navigator.platform).toLowerCase().includes("mac")
        ? "Meta+k"
        : "Control+k",
    )
    await this.page.keyboard.press(shortcut)
    await expect(
      this.page.getByPlaceholder(
        /Search pages, collections, or folders by name/,
      ),
    ).toBeVisible()
  }

  async closeSearchViaEscape() {
    await this.page.keyboard.press("Escape")
    await expect(
      this.page.getByPlaceholder(
        /Search pages, collections, or folders by name/,
      ),
    ).not.toBeVisible()
  }

  async expectSearchTriggerFocused() {
    await expect(
      this.page.getByRole("button", { name: "search-button" }),
    ).toBeFocused()
  }

  async expectNoSearchResults() {
    await expect(
      this.page.getByText(
        /We[\u2019']ve looked everywhere, but we[\u2019']re getting nothing\./,
      ),
    ).toBeVisible()
  }

  async expectSearchResultCount(count: number) {
    const dialog = this.page.getByRole("dialog")
    await expect(
      dialog.getByText(new RegExp(`^${count} search result`)),
    ).toBeVisible()
  }

  async expectSearchModalClosed() {
    await expect(this.page.getByRole("dialog")).toHaveCount(0)
  }

  async expectOnSiteDashboard(siteId: number) {
    await this.page.waitForURL(new RegExp(`/sites/${siteId}$`))
  }

  async expectRecentlyEditedSearchResult(title: string) {
    const dialog = this.page.getByRole("dialog")
    await expect(
      dialog.getByText("Pages recently edited on your site"),
    ).toBeVisible()
    await expect(dialog.getByRole("link", { name: title })).toBeVisible()
  }

  async expectRecentlyViewedSearchResult(title: string) {
    const dialog = this.page.getByRole("dialog")
    await expect(
      dialog.getByText(/Pages you[\u2019']ve recently opened/),
    ).toBeVisible()
    await expect(dialog.getByRole("link", { name: title })).toBeVisible()
  }

  // --- DirectorySidebar ---

  /** Sidebar rows render the resource's own permalink segment, not its title. */
  async expectSidebarItemVisible(permalinkLabel: string) {
    await expect(
      this.page.getByRole("link", { name: permalinkLabel, exact: true }),
    ).toBeVisible()
  }

  async expectSidebarItemHidden(permalinkLabel: string) {
    await expect(
      this.page.getByRole("link", { name: permalinkLabel, exact: true }),
    ).toHaveCount(0)
  }

  async clickSidebarItem(permalinkLabel: string) {
    await this.page
      .getByRole("link", { name: permalinkLabel, exact: true })
      .click()
  }

  #sidebarRow(permalinkLabel: string) {
    return this.page
      .getByRole("link", { name: permalinkLabel, exact: true })
      .locator("xpath=..")
  }

  async toggleSidebarItem(permalinkLabel: string) {
    await this.#sidebarRow(permalinkLabel).getByRole("button").click()
  }

  async expectSidebarItemExpanded(permalinkLabel: string) {
    await expect(
      this.#sidebarRow(permalinkLabel).getByRole("button"),
    ).toHaveAttribute("aria-expanded", "true")
  }

  async expectSidebarItemCollapsed(permalinkLabel: string) {
    await expect(
      this.#sidebarRow(permalinkLabel).getByRole("button"),
    ).toHaveAttribute("aria-expanded", "false")
  }

  async expectSidebarItemActive(permalinkLabel: string) {
    await expect(
      this.page.getByRole("link", { name: permalinkLabel, exact: true }),
    ).toHaveAttribute("aria-selected", "true")
  }

  async expectSidebarItemInactive(permalinkLabel: string) {
    await expect(
      this.page.getByRole("link", { name: permalinkLabel, exact: true }),
    ).toHaveAttribute("aria-selected", "false")
  }

  // --- Breadcrumbs ---

  async clickBreadcrumb(label: string) {
    await this.page
      .getByRole("navigation", { name: "breadcrumb" })
      .getByRole("link", { name: label })
      .click()
  }

  async expectBreadcrumbLinkVisible(label: string) {
    await expect(
      this.page
        .getByRole("navigation", { name: "breadcrumb" })
        .getByRole("link", { name: label }),
    ).toBeVisible()
  }

  async expectBreadcrumbCurrentText(label: string) {
    const breadcrumb = this.page.getByRole("navigation", {
      name: "breadcrumb",
    })
    await expect(breadcrumb.getByText(label, { exact: true })).toBeVisible()
    await expect(breadcrumb.getByRole("link", { name: label })).toHaveCount(0)
  }

  async goBack() {
    await this.page.goBack()
  }
}
