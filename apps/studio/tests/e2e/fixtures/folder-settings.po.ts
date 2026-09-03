import { expect, type Page } from "@playwright/test"

/** FolderSettingsModal — opened from the dashboard resource menu. */
export class FolderSettingsPO {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(this.page.getByLabel("Folder name")).toBeVisible()
  }

  async fillTitle(title: string) {
    await this.page.getByLabel("Folder name").fill(title)
  }

  async saveChanges() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(this.page.getByText("Folder updated!")).toBeVisible()
  }

  async closeWithoutSaving() {
    // The modal's `X` icon button shares the "Close" accessible name (via
    // aria-label) with this footer button, but only this one has "Close" as
    // its actual text content.
    await this.page
      .getByRole("button", { name: "Close" })
      .filter({ hasText: "Close" })
      .click()
    await expect(this.page.getByLabel("Folder name")).not.toBeVisible()
  }
}
