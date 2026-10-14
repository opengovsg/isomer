import { expect, type Page } from "@playwright/test"

export class CollectionLinkPO {
  constructor(private readonly page: Page) {}

  async gotoLink(siteId: number, linkId: string) {
    await this.page.goto(`/sites/${siteId}/links/${linkId}`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/links/${linkId}`))
  }

  async expectLoaded() {
    await expect(this.page.getByText("Edit collection item")).toBeVisible()
  }

  summaryField() {
    return this.page.getByLabel("Summary")
  }

  async fillSummary(summary: string) {
    await this.summaryField().fill(summary)
  }

  // BaseLinkControl has showLinkText: false. Dialog has URL only.
  async addExternalLink(url: string) {
    await this.page.getByRole("button", { name: "Link something..." }).click()
    const dialog = this.page.getByRole("dialog")
    await dialog.getByText("External", { exact: true }).click()
    await dialog.getByPlaceholder("www.isomer.gov.sg").fill(url)
    await dialog.getByRole("button", { name: "Add link" }).click()
  }

  async save() {
    await this.page.getByRole("button", { name: "Save" }).click()
    await expect(this.page.getByText("Link updated!")).toBeVisible()
  }

  async reload() {
    await this.page.reload()
  }

  async expectSummary(summary: string) {
    await expect(this.summaryField()).toHaveValue(summary)
  }

  async expectExternalLinkHref(href: string) {
    await expect(this.page.getByText(href, { exact: true })).toBeVisible()
  }
}
