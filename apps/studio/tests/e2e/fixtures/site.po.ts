import type { Page } from "@playwright/test"

export type SettingsSection =
  | "agency"
  | "colours"
  | "footer"
  | "integrations"
  | "logo"
  | "navbar"
  | "notification"
  | "redirects"

export class SitePO {
  constructor(private readonly page: Page) {}

  async openSite(siteName: string) {
    await this.page.goto("/")
    await this.page.getByRole("link", { name: siteName }).click()
    await this.page.waitForURL(/\/sites\/\d+$/)
  }

  async openSettings() {
    await this.page.getByRole("link", { name: "Settings" }).click()
    await this.page.waitForURL(/\/sites\/\d+\/settings\//)
  }

  async gotoSettingsSection(siteId: number, section: SettingsSection) {
    await this.page.goto(`/sites/${siteId}/settings/${section}`)
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async reloadSettingsSection(section: SettingsSection) {
    await this.page.reload()
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async openSettingsSection(section: SettingsSection) {
    // Settings landing redirects to /agency. To reach other sections we
    // navigate via the settings side-nav (label === section name, title-cased).
    // Labels sourced from apps/studio/src/features/settings/SettingsSidenav/SettingsSidenav.tsx
    const label = SETTINGS_SECTION_LABELS[section]
    await this.page.getByRole("link", { name: label }).click()
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  /**
   * The SettingsHeader-rendered Publish button. Settings forms use "Publish"
   * (see src/features/settings/SettingsHeader.tsx). Non-settings surfaces
   * (page editor, resource modals) use different verbs — add a separate
   * helper for those rather than overloading this one.
   */
  publishButton() {
    return this.page.getByRole("button", { name: "Publish" })
  }

  siteNameField() {
    return this.page.getByLabel("Site name")
  }

  mainBrandColourField() {
    return this.page.getByLabel("Main brand colour")
  }

  gtmIdField() {
    return this.page.getByLabel("Google Tag Manager (GTM) ID")
  }

  notificationBannerToggle() {
    return this.page.getByRole("switch")
  }

  notificationTitleField() {
    return this.page.getByLabel("Notification title")
  }

  /** Logo file input on the logos and favicon settings page. */
  logoUploadInput() {
    return this.page
      .getByRole("group")
      .filter({ hasText: /^Logo/ })
      .getByTestId("file-upload")
  }

  logoFilenameText(filename: string) {
    return this.page.getByText(filename)
  }

  footerLinkButton(name: string) {
    return this.page.getByRole("button", { name })
  }

  navbarItemText(name: string) {
    return this.page.getByText(name, { exact: true })
  }

  redirectSourceField() {
    return this.page.getByPlaceholder("redirect-from")
  }

  redirectDestinationField() {
    return this.page.getByPlaceholder("/path-to-page or https://www.google.com")
  }

  redirectPathText(path: string) {
    return this.page.getByText(path)
  }

  deleteRedirectButton(source: string) {
    return this.page.getByRole("button", {
      name: `Delete redirect for /${source}`,
    })
  }

  bulkUploadRedirectsButton() {
    return this.page.getByRole("button", { name: /bulk upload with a \.csv/i })
  }

  bulkUploadRedirectsDialogTitle() {
    return this.page.getByText("Bulk upload redirects")
  }

  bulkUploadDialogFileInput() {
    return this.page.locator("[role='dialog'] input[type='file']")
  }

  async fillSiteName(name: string) {
    await this.siteNameField().fill(name)
  }

  async setMainBrandColour(hex: string) {
    const field = this.mainBrandColourField()
    await field.clear()
    await field.fill(hex)
  }

  async fillGtmId(id: string) {
    await this.gtmIdField().fill(id)
  }

  async enableNotificationBanner() {
    await this.notificationBannerToggle().click()
  }

  async fillNotificationTitle(title: string) {
    await this.notificationTitleField().fill(title)
  }

  async uploadLogo(filePath: string) {
    await this.logoUploadInput().setInputFiles(filePath)
  }

  async editFooterLinkLabel(linkButtonName: string, newLabel: string) {
    await this.footerLinkButton(linkButtonName).click()
    await this.page.getByLabel("Link label").fill(newLabel)
  }

  async editNavbarItemLabel(itemName: string, newLabel: string) {
    await this.navbarItemText(itemName).click()
    await this.page.getByLabel("Menu item label").fill(newLabel)
  }

  async addRedirect(source: string, destination: string) {
    await this.redirectSourceField().fill(source)
    await this.redirectDestinationField().fill(destination)
    await this.page.getByRole("button", { name: "Add" }).click()
  }

  async deleteRedirect(source: string) {
    await this.deleteRedirectButton(source).click()
    await this.page.getByRole("button", { name: "Delete redirect" }).click()
  }

  async cancelDeleteRedirect(source: string) {
    await this.deleteRedirectButton(source).click()
    await this.page.getByRole("button", { name: "No, keep redirect" }).click()
  }

  async bulkUploadRedirectsCsv(csvContent: string, expectedCount: number) {
    await this.bulkUploadRedirectsButton().click()
    await this.bulkUploadRedirectsDialogTitle().waitFor({ state: "visible" })

    await this.bulkUploadDialogFileInput().setInputFiles({
      name: "redirects.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csvContent),
    })

    await this.page.getByRole("button", { name: "Process redirects" }).click()
    await this.page
      .getByText(`All ${expectedCount} redirects are good to go.`)
      .waitFor({ state: "visible" })

    await this.page
      .getByRole("button", { name: `Publish ${expectedCount} redirects` })
      .click()
    await this.page
      .getByText(`${expectedCount} redirects published`)
      .waitFor({ state: "visible" })
  }

  async expectLogoFilenameVisible(filename: string) {
    await this.logoFilenameText(filename).waitFor({ state: "visible" })
  }

  async expectNotificationTitleFieldVisible() {
    await this.notificationTitleField().waitFor({ state: "visible" })
  }

  /**
   * Click the settings Publish button. Pass `{ force: true }` when a FormBuilder
   * inline editor (navbar/footer link rows) overlays the header button.
   */
  async clickPublish(options?: { force?: boolean }) {
    await this.publishButton().click(options)
  }

  /**
   * The toast that appears after a successful Publish on a settings page.
   * The text "Changes published" is settings-specific; do not reuse for
   * other success paths without verifying their toast copy.
   */
  async expectChangesPublishedToast() {
    await this.page
      .getByText("Changes published")
      .first()
      .waitFor({ state: "visible" })
  }
}
