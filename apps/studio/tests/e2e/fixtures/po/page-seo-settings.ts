import { expect, type Page } from "@playwright/test"

/**
 * Top-nav Meta Settings route (`/sites/:siteId/pages/:pageId/settings`).
 * Distinct from `PageEditorPO.openMetaSettings()`, which opens the in-editor
 * page-header drawer, and from `PageSettingsPO` (dashboard title/permalink
 * modal). This form autosaves on blur (`toast "Saved page metadata"`).
 */
export class PageSeoSettingsPO {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await expect(
      this.page.getByRole("heading", { name: "Meta settings" }),
    ).toBeVisible()
  }

  async fillMetaDescription(text: string) {
    await this.page
      .getByPlaceholder("Meta description", { exact: true })
      .fill(text)
  }

  async expectMetaDescription(text: string) {
    await expect(
      this.page.getByPlaceholder("Meta description", { exact: true }),
    ).toHaveValue(text)
  }

  async uploadMetaImage(
    file: string | { name: string; mimeType: string; buffer: Buffer },
  ) {
    const removeButton = this.page.getByRole("button", { name: "Remove file" })
    if (await removeButton.isVisible()) {
      await removeButton.click()
    }
    await this.page.getByTestId("file-upload").setInputFiles(file)
  }

  async expectMetaImageFilename(filename: string) {
    // ODS Attachment also renders "File attached: <filename>…" — exact
    // match avoids the strict-mode collision with that prefix text.
    await expect(this.page.getByText(filename, { exact: true })).toBeVisible()
  }

  noIndexSwitch() {
    // ODS Switch is a checkbox input; `aria-label` on JsonFormsBooleanControl
    // is the accessible name (htmlFor association is unreliable on this widget).
    return this.page.getByLabel(
      "Prevent search engines from indexing this page?",
    )
  }

  async setNoIndex(checked: boolean) {
    const toggle = this.noIndexSwitch()
    if ((await toggle.isChecked()) !== checked) {
      // Chakra switch label intercepts pointer events on the checkbox input.
      await toggle.click({ force: true })
    }
  }

  async expectNoIndex(checked: boolean) {
    if (checked) {
      await expect(this.noIndexSwitch()).toBeChecked()
    } else {
      await expect(this.noIndexSwitch()).not.toBeChecked()
    }
  }

  /** Blur the autosave form so `updateMeta` fires, then wait for the toast. */
  async saveByBlur() {
    await this.page.getByRole("heading", { name: "Meta settings" }).click()
    await expect(this.page.getByText("Saved page metadata")).toBeVisible()
  }
}
