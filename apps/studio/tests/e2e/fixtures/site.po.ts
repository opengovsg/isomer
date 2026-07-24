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

  /** Logo file input on the logos and favicon settings page. */
  logoUploadInput() {
    return this.page
      .getByRole("group")
      .filter({ hasText: /^Logo/ })
      .getByTestId("file-upload")
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
