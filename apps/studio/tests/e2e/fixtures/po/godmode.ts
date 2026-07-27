import { expect, type Page, type Response } from "@playwright/test"
import { e2eCodeBuildIdForSite } from "~e2e/fixtures/site"

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

  async gotoPublishing(siteId: number) {
    const codeBuildId = e2eCodeBuildIdForSite(siteId)
    const sitesLoaded = this.page.waitForResponse((response) =>
      responseIncludesPublishableSite(response, siteId, codeBuildId),
    )
    await this.page.goto("/godmode/publishing")
    await this.page.waitForURL(/\/godmode\/publishing$/)
    await expect(
      this.page.getByRole("heading", { name: "Publishing" }),
    ).toBeVisible()
    await sitesLoaded
    await this.expectPublishButtonVisibleForSite(siteId)
  }

  async expectPublishButtonVisibleForSite(siteId: number) {
    await expect(this.publishButtonForSite(siteId)).toBeVisible()
  }

  async clickPublishForSite(siteId: number) {
    // force: true — clearSiteCodeBuildId can trigger a refetch that hides
    // the button before the click lands; the row was already validated.
    await this.publishButtonForSite(siteId).click({ force: true })
  }

  private publishButtonForSite(siteId: number) {
    return this.page
      .getByRole("row")
      .filter({ hasText: e2eCodeBuildIdForSite(siteId) })
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
    await this.page
      .locator('h1:has-text("Vendors (90 day expiry)") + textarea')
      .fill(emails.join("\n"))
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

interface ListAllSitesRow {
  id: number
  codeBuildId: string | null
}

const responseIncludesPublishableSite = async (
  response: Response,
  siteId: number,
  codeBuildId: string,
) => {
  if (!response.url().includes("site.listAllSites") || !response.ok()) {
    return false
  }

  const body = (await response.json()) as {
    result?: { data?: { json?: ListAllSitesRow[] } }
  }
  const sites = body.result?.data?.json
  if (!Array.isArray(sites)) {
    return false
  }

  return sites.some(
    (site) => site.id === siteId && site.codeBuildId === codeBuildId,
  )
}
