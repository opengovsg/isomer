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
}
