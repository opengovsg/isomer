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

  async gotoSettings(siteId: number, section: SettingsSection) {
    await this.page.goto(`/sites/${siteId}/settings/${section}`)
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
