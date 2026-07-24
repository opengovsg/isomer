import type { Page } from "@playwright/test"

export class DashboardPO {
  constructor(private readonly page: Page) {}

  async gotoSite(siteId: number) {
    await this.page.goto(`/sites/${siteId}`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}$`))
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
}
