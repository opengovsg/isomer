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
    await this.page.goto(path)
    await this.page.waitForURL("/")
    await expect(this.page).toHaveURL(/\/$/)
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

  async clickCreateSite() {
    await this.page.getByRole("button", { name: "Create Site" }).click()
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
    // The page renders one Publish button per site, gated on the client-side
    // listAllSites query. With many sites this response can land just after the
    // default assertion timeout, so wait for the data before asserting on rows.
    const sitesLoaded = this.page.waitForResponse(
      (response) =>
        response.url().includes("site.listAllSites") && response.ok(),
    )
    await this.page.goto("/godmode/publishing")
    await this.page.waitForURL(/\/godmode\/publishing$/)
    await expect(
      this.page.getByRole("heading", { name: "Publishing" }),
    ).toBeVisible()
    await sitesLoaded
  }

  async expectPublishButtonVisibleForSite(siteId: number) {
    const button = this.publishButtonForSite(siteId)
    // listAllSites can resolve before React paints the table in CI.
    await expect
      .poll(async () => button.isVisible(), { timeout: 15_000 })
      .toBe(true)
  }

  async clickPublishForSite(siteId: number) {
    await this.publishButtonForSite(siteId).click()
  }

  private publishButtonForSite(siteId: number) {
    // Tests seed a unique codeBuildId; it's more specific than site id alone.
    return this.page
      .getByRole("row")
      .filter({ hasText: `e2e-codebuild-${siteId}` })
      .getByRole("button", { name: "Publish" })
  }

  async expectSitePublishedToast() {
    await this.page
      .getByText("Site published successfully")
      .waitFor({ state: "visible" })
  }

  async gotoWhitelist() {
    await this.page.goto("/godmode/whitelist")
    await this.page.waitForURL(/\/godmode\/whitelist$/)
    await expect(
      this.page.getByRole("heading", { name: "Whitelist" }),
    ).toBeVisible()
  }

  async fillVendorEmails(emails: string[]) {
    await this.page.locator("textarea").nth(1).fill(emails.join("\n"))
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
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
