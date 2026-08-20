import { expect, type Page } from "@playwright/test"

export class PageEditorPO {
  constructor(private readonly page: Page) {}

  async gotoPage(siteId: number, pageId: string) {
    await this.page.goto(`/sites/${siteId}/pages/${pageId}`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/pages/${pageId}`))
  }

  async expectLoaded() {
    await expect(
      this.page.getByRole("link", { name: "Meta Settings" }),
    ).toBeVisible()
  }

  async reload() {
    await this.page.reload()
  }

  /**
   * Opens a root-drawer block by its accessible name, then fills the first
   * textbox in the block editor. Label examples: "Content page header",
   * "Test block" (seeded prose preview text).
   */
  async fillBlock(label: string, text: string) {
    // Block buttons in the root drawer use mixed casing ("Article page header"
    // vs "This is a prose block") — case-insensitive match on the label arg.
    await this.page
      .getByRole("button", { name: new RegExp(label, "i") })
      .click({ force: true })
    await this.page.getByRole("textbox").first().fill(text)
  }

  async saveBlockChanges() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(this.page.getByText(/Changes saved/)).toBeVisible()
  }

  async editProseBlock(previewLabel: string, text: string) {
    await this.fillBlock(previewLabel, text)
    await this.saveBlockChanges()
  }

  async addTextBlock() {
    await this.page.getByRole("button", { name: "Add block" }).click()
    await this.page
      .getByRole("button", { name: /^Text Add text, links, lists/i })
      .click()
  }

  async addAndFillTextBlock(text: string) {
    await this.addTextBlock()
    await this.page.getByRole("textbox").first().fill(text)
    await this.saveBlockChanges()
  }

  async expectBlockPreview(text: string) {
    await expect(
      this.page.getByRole("button", { name: new RegExp(text, "i") }),
    ).toBeVisible()
  }

  async clickPublish() {
    await this.page
      .getByRole("button", { name: "Publish", exact: true })
      .click()
    await this.page.getByRole("button", { name: "Publish now" }).click()
  }

  async cancelPublishConfirmation() {
    await this.page
      .getByRole("button", { name: "Publish", exact: true })
      .click()
    await this.page.getByRole("button", { name: "No, don't publish" }).click()
    await expect(this.page.getByText("Publish this page?")).not.toBeVisible()
  }

  async expectPublishedToast() {
    await this.page
      .getByText("Page published successfully")
      .first()
      .waitFor({ state: "visible" })
  }

  async expectPublishButtonVisible() {
    await expect(
      this.page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeVisible()
  }

  async expectPublishButtonDisabled() {
    await expect(
      this.page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeDisabled()
  }

  async expectPublishButtonEnabled() {
    await expect(
      this.page.getByRole("button", { name: "Publish", exact: true }),
    ).toBeEnabled()
  }

  async expectScheduleOptionsDisabled() {
    await expect(
      this.page.getByRole("button", { name: "More options" }),
    ).toBeDisabled()
  }

  async openMetaSettingsTab() {
    await this.page.getByRole("link", { name: "Meta Settings" }).click()
    await this.page.waitForURL(/\/pages\/\d+\/settings$/)
  }

  async openScheduleModal() {
    const publish = this.page.getByRole("button", {
      name: "Publish",
      exact: true,
    })
    await expect(publish).toBeVisible()
    await expect(publish).toBeEnabled()
    await this.page.getByRole("button", { name: "More options" }).click()
    await this.page
      .getByRole("menuitem", { name: /Schedule for later/i })
      .click()
    await expect(
      this.page.getByText("When should we publish this page?"),
    ).toBeVisible()
  }

  /** `quickSelectLabel` must match one of QUICK_SELECT_TIMES' rendered labels
   * exactly (e.g. "9:00 AM", "5:00 PM") — pass a different label than a prior
   * call to reschedule to a distinct time. Matching by exact label, rather
   * than position, avoids ambiguity with the (also form-scoped) TimeSelect
   * control, which renders the same label text once a time is selected. */
  async schedulePublishForToday(quickSelectLabel = "5:00 PM") {
    await this.page
      .getByRole("button", { name: "Select from date picker." })
      .click()
    await this.page.getByRole("button", { name: "Today" }).click()
    await this.page
      .locator("form")
      .getByText(quickSelectLabel, { exact: true })
      .click()
    await this.page.getByRole("button", { name: "Schedule publish" }).click()
  }

  async expectScheduledSuccessfully() {
    await expect(
      this.page.getByText("Page scheduled successfully"),
    ).toBeVisible()
  }

  async expectCancelScheduleVisible() {
    await expect(
      this.page.getByRole("button", { name: "Cancel schedule" }),
    ).toBeVisible()
  }

  async cancelSchedule() {
    await this.page.getByRole("button", { name: "Cancel schedule" }).click()
    await this.page
      .getByRole("button", { name: "Yes, cancel the schedule" })
      .click()
    await expect(
      this.page.getByText("Schedule cancelled successfully"),
    ).toBeVisible()
  }

  async expectScheduledEditingRestrictionBanner() {
    await expect(
      this.page.getByText(
        "This page is scheduled for publishing. To make changes, cancel the schedule first.",
      ),
    ).toBeVisible()
  }
}
