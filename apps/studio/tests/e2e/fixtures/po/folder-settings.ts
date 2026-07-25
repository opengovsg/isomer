import { expect, type Page } from "@playwright/test"

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
    // Icon Close and footer Close share the same accessible name.
    // filter({ hasText: "Close" }) picks the footer.
    await this.page
      .getByRole("button", { name: "Close" })
      .filter({ hasText: "Close" })
      .click()
    await expect(this.page.getByLabel("Folder name")).not.toBeVisible()
  }
}
