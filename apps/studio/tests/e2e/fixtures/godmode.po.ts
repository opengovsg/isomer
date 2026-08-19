import { expect, type Page } from "@playwright/test"

export class GodmodePO {
  constructor(private readonly page: Page) {}

  async gotoHub() {
    await this.page.goto("/godmode")
    await this.page.waitForURL(/\/godmode$/)
    await expect(
      this.page.getByRole("heading", { name: /God Mode/ }),
    ).toBeVisible()
  }

  async expectHubLinkVisible(name: string) {
    await expect(this.page.getByRole("link", { name })).toBeVisible()
  }

  async expectHubLinkHidden(name: string) {
    await expect(this.page.getByRole("link", { name })).not.toBeVisible()
  }

  async expectRedirectToDashboard(path: string) {
    const responsePromise = this.page.waitForResponse((response) => {
      const url = new URL(response.url())
      return url.pathname === path && response.request().isNavigationRequest()
    })

    await this.page.goto(path)
    const response = await responsePromise

    expect(response.status()).toBe(307)
    await expect(this.page).toHaveURL(/\/$/)
    await expect(
      this.page.getByRole("heading", { name: /God Mode/ }),
    ).not.toBeVisible()
  }

  async gotoCreateSite() {
    await this.page.goto("/godmode/create-site")
    await this.page.waitForURL(/\/godmode\/create-site$/)
    await expect(
      this.page.getByRole("heading", { name: "Create a new site" }),
    ).toBeVisible()
  }

  async fillSiteName(siteName: string) {
    await this.page.getByLabel("Site name").fill(siteName)
  }

  siteNameInput() {
    return this.page.getByLabel("Site name")
  }

  async clickCreateSite() {
    await this.page.getByRole("button", { name: "Create Site" }).click()
  }

  async expectCreateSiteFailedToast() {
    await this.page
      .getByText("Failed to create site")
      .waitFor({ state: "visible" })
  }

  async expectSiteCreatedToast(siteName: string) {
    await this.page
      .getByText(
        new RegExp(
          `Site ${escapeRegExp(siteName)} \\(id: \\d+\\) created successfully`,
        ),
      )
      .waitFor({ state: "visible" })
  }

  async expectRedirectToCreatedSite(): Promise<number> {
    await this.page.waitForURL(/\/sites\/\d+$/)
    const match = this.page.url().match(/\/sites\/(\d+)$/)
    if (!match) {
      throw new Error(`Expected /sites/{id} URL, got ${this.page.url()}`)
    }
    return Number(match[1])
  }

  async gotoPublishing() {
    await this.page.goto("/godmode/publishing")
    await this.page.waitForURL(/\/godmode\/publishing$/)
    await expect(
      this.page.getByRole("heading", { name: "Publishing" }),
    ).toBeVisible()
  }

  siteRow(siteId: number) {
    return this.page.getByRole("row").filter({
      has: this.page.getByRole("cell", { name: String(siteId), exact: true }),
    })
  }

  async expectSiteListed(opts: {
    siteId: number
    siteName: string
    codeBuildId: string
  }) {
    const row = this.siteRow(opts.siteId)
    await expect(row).toBeVisible()
    await expect(row).toContainText(opts.siteName)
    await expect(row).toContainText(opts.codeBuildId)
  }

  async clickPublishForSite(siteId: number) {
    await this.siteRow(siteId).getByRole("button", { name: "Publish" }).click()
  }

  async expectPublishButtonVisible(siteId: number) {
    await expect(
      this.siteRow(siteId).getByRole("button", { name: "Publish" }),
    ).toBeVisible()
  }

  async expectPublishButtonHidden(siteId: number) {
    await expect(
      this.siteRow(siteId).getByRole("button", { name: "Publish" }),
    ).toHaveCount(0)
  }

  async expectSitePublishedToast() {
    await this.page
      .getByText("Site published successfully")
      .waitFor({ state: "visible" })
  }

  async expectPublishFailedToast(message?: string) {
    await this.page
      .getByText("Failed to publish site")
      .waitFor({ state: "visible" })
    if (message) {
      await this.page.getByText(message).waitFor({ state: "visible" })
    }
  }

  async gotoWhitelist() {
    await this.page.goto("/godmode/whitelist")
    await this.page.waitForURL(/\/godmode\/whitelist$/)
    await expect(
      this.page.getByRole("heading", { name: "Whitelist" }),
    ).toBeVisible()
  }

  vendorEmailsTextarea() {
    return this.page.locator("textarea").nth(1)
  }

  async fillVendorEmails(emails: string[]) {
    await this.vendorEmailsTextarea().fill(emails.join("\n"))
  }

  async clickWhitelistSubmit() {
    await this.page.getByRole("button", { name: "Submit" }).click()
  }

  async expectWhitelistSuccessToast(adminCount: number, vendorCount: number) {
    await this.page
      .getByText(
        `Successfully whitelisted ${adminCount} admin(s) and ${vendorCount} vendor(s)`,
      )
      .waitFor({ state: "visible" })
  }

  async expectWhitelistErrorToast() {
    await this.page.getByText(/invalid email/i).waitFor({ state: "visible" })
  }
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
