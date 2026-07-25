import { expect, type Page, type Response } from "@playwright/test"

export class SiteAdminPO {
  constructor(private readonly page: Page) {}

  async goto(siteId: number) {
    await this.page.goto(`/sites/${siteId}/admin`)
    await this.page.waitForURL(/\/admin$/)
  }

  async expectLoaded() {
    await expect(
      this.page.getByText("Manage site configurations"),
    ).toBeVisible()
    await expect(
      this.page.getByText("Site config", { exact: true }),
    ).toBeVisible()
    await expect(
      this.page.getByText("Site theme", { exact: true }),
    ).toBeVisible()
    await expect(
      this.page.getByText("Site navbar", { exact: true }),
    ).toBeVisible()
    await expect(
      this.page.getByText("Site footer", { exact: true }),
    ).toBeVisible()
    await expect(
      this.page.getByRole("button", { name: "Save settings" }),
    ).toBeVisible()
  }

  async gotoAndAwaitNavigationResponse(siteId: number): Promise<Response> {
    const adminResponsePromise = this.page.waitForResponse((response) => {
      const url = new URL(response.url())
      return (
        url.pathname === `/sites/${siteId}/admin` &&
        response.request().isNavigationRequest()
      )
    })

    await this.page.goto(`/sites/${siteId}/admin`)
    return adminResponsePromise
  }

  async expectRedirectedToSiteDashboard(siteId: number) {
    await expect(this.page).toHaveURL(new RegExp(`/sites/${siteId}$`))
    await expect(
      this.page.getByText("Manage site configurations"),
    ).not.toBeVisible()
  }
}
