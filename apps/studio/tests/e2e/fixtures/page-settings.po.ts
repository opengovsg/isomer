import { expect, type Page } from "@playwright/test"

/** PageSettingsModal — opened from the dashboard resource menu. */
export class PageSettingsPO {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(this.page.getByLabel("Title")).toBeVisible()
  }

  async fillTitle(title: string) {
    await this.page.getByLabel("Title").fill(title)
  }

  async fillPermalink(permalink: string) {
    await this.page.getByLabel("URL").fill(permalink)
  }

  async expectRedirectOptionVisible() {
    await expect(
      this.page.getByText("Redirect page automatically"),
    ).toBeVisible()
  }

  async expectRedirectOptionHidden() {
    await expect(
      this.page.getByText("Redirect page automatically"),
    ).toHaveCount(0)
  }

  async expectSaveButtonVisible() {
    await expect(this.page.getByRole("button", { name: "Save" })).toBeVisible()
  }

  async expectPublishImmediatelyHidden() {
    await expect(
      this.page.getByRole("button", { name: "Publish immediately" }),
    ).toHaveCount(0)
  }

  async saveDraft() {
    await this.page.getByRole("button", { name: "Save" }).click()
    await expect(this.page.getByText("Saved settings")).toBeVisible()
  }

  async saveAndPublish() {
    await this.page.getByRole("button", { name: "Publish immediately" }).click()
    await expect(
      this.page.getByText("Saved and published settings"),
    ).toBeVisible()
  }
}
