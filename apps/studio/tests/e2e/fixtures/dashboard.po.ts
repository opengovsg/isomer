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

  async expectCreateButtonHidden() {
    await expect(
      this.page.getByRole("button", { name: "Create new..." }),
    ).not.toBeVisible()
  }

  async openResourceMenu(title: string) {
    await this.page
      .getByRole("button", { name: `Options for ${title}` })
      .click()
  }

  async clickCreatePage() {
    await this.page.getByRole("menuitem", { name: "Page" }).click()
  }

  async clickCreateFolder() {
    await this.page.getByRole("menuitem", { name: "Folder" }).click()
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

  async openPageSettings(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible()
    await this.openResourceMenu(title)
    await this.page.getByRole("menuitem", { name: "Edit settings" }).click()
  }

  async expectScheduledBadge(title: string) {
    const row = this.page.getByRole("row").filter({ hasText: title })
    await expect(row.getByText("Scheduled")).toBeVisible()
  }

  async gotoCollection(siteId: number, collectionId: string) {
    await this.page.goto(`/sites/${siteId}/collections/${collectionId}`)
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/collections/${collectionId}$`),
    )
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

  async expectDeleteMenuHidden() {
    await expect(
      this.page.getByRole("menuitem", { name: "Delete", exact: true }),
    ).not.toBeVisible()
  }

  async expectMoveMenuHidden() {
    const moveByVisibleText = this.page.getByRole("menuitem", {
      name: "Move to...",
    })
    const moveByAriaLabel = this.page.getByRole("menuitem", {
      name: /Move resource to another location for/,
    })
    await expect(moveByAriaLabel.or(moveByVisibleText)).not.toBeVisible()
  }

  async expectSearchPageMenuItemsDisabled() {
    await expect(
      this.page.getByRole("menuitem", { name: "Edit settings" }),
    ).toBeDisabled()
    await expect(
      this.page.getByRole("menuitem", { name: "Move to..." }),
    ).toBeDisabled()
    await expect(
      this.page.getByRole("menuitem", { name: "Delete", exact: true }),
    ).toBeDisabled()
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

  async confirmMove() {
    const moveButton = this.page.getByRole("button", { name: "Move here" })
    await expect(moveButton).toBeEnabled()
    await moveButton.click()
    await expect(this.page.getByText("Resource moved!")).toBeVisible()
  }

  async cancelMove() {
    await this.page.getByRole("button", { name: "Cancel" }).click()
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

  async expectSearchResultsDialogHidden() {
    await expect(
      this.page.getByPlaceholder(
        /Search pages, collections, or folders by name/,
      ),
    ).not.toBeVisible()
  }
}
