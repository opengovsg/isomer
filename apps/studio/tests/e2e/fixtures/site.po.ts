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

  async openSettingsSection(section: SettingsSection) {
    // Settings landing redirects to /agency. To reach other sections we
    // navigate via the settings side-nav (label === section name, title-cased).
    // Labels sourced from apps/studio/src/features/settings/SettingsSidenav/SettingsSidenav.tsx
    const label = SETTINGS_SECTION_LABELS[section]
    await this.page.getByRole("link", { name: label }).click()
    await this.page.waitForURL(new RegExp(`/settings/${section}$`))
  }

  saveButton() {
    return this.page.getByRole("button", { name: "Publish" })
  }

  async expectSuccessToast() {
    await this.page
      .getByText("Changes published")
      .first()
      .waitFor({ state: "visible" })
  }
}

// Labels come from SIDENAV_ITEMS in:
// apps/studio/src/features/settings/SettingsSidenav/SettingsSidenav.tsx
const SETTINGS_SECTION_LABELS: Record<SettingsSection, string> = {
  agency: "Name and agency",
  colours: "Colours",
  footer: "Footer",
  integrations: "Integrations",
  logo: "Logos and favicon", // spec said "Logo" — actual label is "Logos and favicon"
  navbar: "Navigation bar", // spec said "Navbar" — actual label is "Navigation bar"
  notification: "Notification banner", // spec said "Notification" — actual label is "Notification banner"
  redirects: "Redirects",
}
