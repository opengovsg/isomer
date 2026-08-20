import { expect, type Page } from "@playwright/test"

export class SitesListPO {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/")
  }

  async expectHeadingVisible() {
    await expect(
      this.page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
  }

  async expectSiteLinkVisible(name: string) {
    await expect(this.page.getByRole("link", { name })).toBeVisible()
  }

  async expectSiteLinkHidden(name: string) {
    await expect(this.page.getByRole("link", { name })).not.toBeVisible()
  }

  async clickSiteLink(name: string) {
    await this.page.getByRole("link", { name }).click()
  }

  async expectEmptyState() {
    await expect(
      this.page.getByText("You don't have access to any sites yet."),
    ).toBeVisible()
  }
}
