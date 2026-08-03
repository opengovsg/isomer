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

  async gotoSettingsSection(siteId: number, section: SettingsSection) {
    await this.page.goto(`/sites/${siteId}/settings/${section}`)
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async reloadSettingsSection(section: SettingsSection) {
    await this.page.reload()
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  async openSettingsSection(section: SettingsSection) {
    // Side-nav labels from SettingsSidenav.tsx. /settings redirects to /agency.
    const label = SETTINGS_SECTION_LABELS[section]
    await this.page.getByRole("link", { name: label }).click()

    const urlPattern = new RegExp(`/settings/${section}$`)
    const confirmLeaveButton = this.page.getByRole("button", {
      name: "Yes, leave this page",
    })
    // Dirty form on mount can block nav. Click through if the prompt appears.
    const dismissIfShown = confirmLeaveButton
      .waitFor({ state: "visible" })
      .then(() => confirmLeaveButton.click())
      .catch(() => undefined)

    await Promise.race([this.page.waitForURL(urlPattern), dismissIfShown])
    await this.page.waitForURL(urlPattern)
  }

  // Settings Publish only. Page editor and modals use different button labels.
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
    // Chakra Switch exposes role=checkbox, not switch.
    return this.page.getByRole("checkbox")
  }

  notificationTitleField() {
    return this.page.getByLabel("Notification title")
  }

  logoUploadGroup() {
    return this.page.getByRole("group").filter({ hasText: /^Logo/ })
  }

  // Hidden under the dropzone. setInputFiles works; assert logoUploadGroup instead.
  logoUploadInput() {
    return this.logoUploadGroup().getByTestId("file-upload")
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
    return this.page.getByText(path, { exact: true })
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
    // Input has pointer-events: none. Click the wrapping label.
    await this.notificationBannerToggle().locator("xpath=..").click()
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
    // Edit panel covers Publish until dismissed.
    await this.page.getByRole("button", { name: "Back to footer" }).click()
  }

  async editNavbarItemLabel(itemName: string, newLabel: string) {
    await this.navbarItemText(itemName).click()
    await this.page.getByLabel("Menu item label").fill(newLabel)
    // Edit panel covers Publish until dismissed.
    await this.page
      .getByRole("button", { name: "Back to navigation bar" })
      .click()
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
    // Wait for dialog teardown or redirect path text collides in strict mode.
    await this.page.getByLabel("Delete redirect?").waitFor({ state: "hidden" })
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

  async clickPublish() {
    await this.publishButton().click()
  }

  // Toast copy is "Changes published". Other surfaces use different strings.
  async expectChangesPublishedToast() {
    await this.page
      .getByText("Changes published")
      .first()
      .waitFor({ state: "visible" })
  }
}

// Labels from SettingsSidenav.tsx SIDENAV_ITEMS
const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  agency: "Name and agency",
  colours: "Colours",
  footer: "Footer",
  integrations: "Integrations",
  logo: "Logos and favicon", // not "Logo"
  navbar: "Navigation bar", // not "Navbar"
  notification: "Notification banner", // not "Notification"
  redirects: "Redirects",
}
