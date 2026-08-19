import { expect, type Page } from "@playwright/test"

export class PageEditorPO {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(
      this.page.getByRole("link", { name: "Meta Settings" }),
    ).toBeVisible()
  }

  /**
   * Opens a root-drawer block by its accessible name, then fills the first
   * textbox in the block editor. Label examples: "Content page header",
   * "This is a prose block".
   */
  async fillBlock(label: string, text: string) {
    // Block buttons in the root drawer use mixed casing ("Article page header"
    // vs "This is a prose block") — case-insensitive match on the label arg.
    await this.page
      .getByRole("button", { name: new RegExp(label, "i") })
      .click()
    await this.page.getByRole("textbox").first().fill(text)
  }

  async clickPublish() {
    await this.page.getByRole("button", { name: "Publish" }).click()
    await this.page.getByRole("button", { name: "Publish now" }).click()
  }

  async expectPublishedToast() {
    await this.page
      .getByText("Page published successfully")
      .first()
      .waitFor({ state: "visible" })
  }

  async openMetaSettingsTab() {
    await this.page.getByRole("link", { name: "Meta Settings" }).click()
    await this.page.waitForURL(/\/pages\/\d+\/settings$/)
  }
}
