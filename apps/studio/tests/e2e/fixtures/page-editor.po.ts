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

  private publishOptionsButton() {
    return this.page.getByRole("button", {
      name: "Publish options",
      exact: true,
    })
  }

  async clickPublish() {
    await this.publishOptionsButton().click()
    await this.page.getByRole("button", { name: "Publish now" }).click()
  }

  async cancelPublishConfirmation() {
    await this.publishOptionsButton().click()
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
    await expect(this.publishOptionsButton()).toBeVisible()
  }

  async expectPublishButtonDisabled() {
    await expect(this.publishOptionsButton()).toBeDisabled()
  }

  async expectPublishButtonEnabled() {
    await expect(this.publishOptionsButton()).toBeEnabled()
  }

  async expectScheduleOptionsDisabled() {
    // Scheduling is inside the Publish options modal. Editors cannot open it.
    await expect(this.publishOptionsButton()).toBeDisabled()
  }

  async openMetaSettingsTab() {
    await this.page.getByRole("link", { name: "Meta Settings" }).click()
    await this.page.waitForURL(/\/pages\/\d+\/settings$/)
  }

  async openScheduleModal() {
    const publish = this.publishOptionsButton()
    await expect(publish).toBeVisible()
    await expect(publish).toBeEnabled()
    await publish.click()
    await expect(this.page.getByText("Publish this page?")).toBeVisible()
    // Chakra's useRadio marks the visible card aria-hidden, so the radio
    // input has an empty accessible name. Click the visible label instead.
    await this.page.getByText("Publish later", { exact: true }).click()
    await expect(
      this.page.getByRole("button", { name: /Select from date picker/i }),
    ).toBeVisible()
  }

  /** `timeLabel` is a 12-hour clock label such as "9:00 AM" or "5:00 PM".
   * TimeSelect renders zero-padded options ("09:00 AM", "05:00 PM"). Pass a
   * different label than a prior call to reschedule to a distinct time. */
  async schedulePublishForToday(timeLabel = "5:00 PM") {
    const optionLabel = timeLabel.replace(/^(\d):/, "0$1:")
    await this.page
      .getByRole("button", { name: /Select from date picker/i })
      .click()
    await this.page
      .getByRole("button", { name: "Focus on today's date" })
      .click()
    // The "Select time" placeholder sits under the react-select control,
    // which intercepts the click. The combobox is the control itself.
    await this.page.getByRole("combobox").click()
    await this.page
      .getByRole("option", { name: optionLabel, exact: true })
      .click()
    await this.page.getByRole("button", { name: "Schedule publish" }).click()
  }

  async expectScheduledSuccessfully() {
    await expect(this.page.getByText("scheduled to publish on")).toBeVisible()
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
