import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

export class CollectionPO {
  constructor(private readonly page: Page) {}

  async gotoIndex(siteId: number, indexPageId: string) {
    await this.page.goto(`/sites/${siteId}/pages/${indexPageId}`)
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/pages/${indexPageId}`),
    )
  }

  async reload() {
    await this.page.reload()
  }

  /**
   * Selects `optionLabel` in the tag-category multi-select labelled
   * `categoryLabel`. Both LinkEditorDrawer and MetadataEditorStateDrawer
   * render tag categories through the same JsonFormsTaggedControl.
   *
   * Scoped via the FormControl `group` rather than `getByLabel`: the
   * MultiSelect's downshift input id/aria-labelledby doesn't match the
   * FormLabel's Chakra-generated id, so there is no valid label association
   * for `getByLabel` to resolve.
   */
  async selectTagOption(categoryLabel: string, optionLabel: string) {
    await this.page
      .getByRole("group")
      .filter({ hasText: categoryLabel })
      .getByRole("combobox")
      .click()
    await this.page.getByRole("option", { name: optionLabel }).click()
    // Close the dropdown so it doesn't obscure the Save button underneath.
    await this.page.keyboard.press("Escape")
  }

  async expectTagOptionVisible(optionLabel: string) {
    await expect(
      this.page.getByRole("option", { name: optionLabel }),
    ).toBeVisible()
  }

  async expectTagOptionHidden(optionLabel: string) {
    await expect(
      this.page.getByRole("option", { name: optionLabel }),
    ).toHaveCount(0)
  }

  async openTagCategory(categoryLabel: string) {
    await this.page
      .getByRole("group")
      .filter({ hasText: categoryLabel })
      .getByRole("combobox")
      .click()
  }

  /**
   * The JsonFormsTaggedControl error shown under a required tag category
   * with no option selected.
   */
  async expectRequiredTagError() {
    await expect(
      this.page.getByText("At least one option must be selected"),
    ).toBeVisible()
  }

  async openArticleHeader() {
    await this.page
      .getByRole("button", { name: "Article page header" })
      .click({ force: true })
  }

  /** New collection editing experience root section (feature flag on). */
  async expectManageCollectionVisible() {
    await expect(this.page.getByText("Manage Collection")).toBeVisible()
  }

  async expectCollectionSettingsVisible() {
    await expect(
      this.page.getByRole("button", { name: /Collection settings/i }),
    ).toBeVisible()
  }

  async expectCollectionDisplayVisible() {
    await expect(
      this.page.getByRole("button", { name: /Collection display/i }),
    ).toBeVisible()
  }

  async expectFiltersVisible() {
    await expect(
      this.page.getByRole("button", { name: /Filters/i }),
    ).toBeVisible()
  }

  async expectFiltersHidden() {
    await expect(
      this.page.getByRole("button", { name: /Filters/i }),
    ).not.toBeVisible()
  }

  async openCollectionDisplay() {
    await this.page.getByRole("button", { name: /Collection display/i }).click()
    await expect(
      this.page.getByText("Collection display").first(),
    ).toBeVisible()
  }

  async openFilters() {
    await this.page.getByRole("button", { name: /Filters/i }).click()
  }

  async expectManageFiltersDrawerOpen() {
    await expect(this.page.getByText("Manage filters")).toBeVisible()
  }

  async addFilter() {
    await this.page.getByRole("button", { name: /Add a filter/i }).click()
  }

  async openFilterNamed(name: string) {
    await this.page.getByText(name, { exact: true }).first().click()
    await expect(this.page.getByText(/Edit Filters/i)).toBeVisible()
  }

  async returnToFilters() {
    await this.page.getByRole("button", { name: /Return to Filters/i }).click()
    await this.expectManageFiltersDrawerOpen()
  }

  async fillFilterName(name: string) {
    const input = this.page.getByPlaceholder(/Filter name/i)
    await input.fill(name)
  }

  async setFilterRequired(required: boolean) {
    const toggle = this.page.getByLabel("This filter is required")
    const isChecked = await toggle.isChecked()
    if (isChecked !== required) {
      await toggle.click()
    }
  }

  async chooseFilterPresentation(presentation: "Pills" | "Plaintext") {
    await this.page.getByRole("radio", { name: presentation }).click()
  }

  async addOption() {
    await this.page.getByRole("button", { name: /^Add option$/i }).click()
  }

  async renameOptionAtIndex(index0Based: number, name: string) {
    const optionName = `Option ${index0Based + 1}`
    const namedRow = this.page.getByText(
      new RegExp(`^Option ${index0Based + 1}$`),
    )
    const newOption = this.page.getByText(/^New option$/).first()
    if (await namedRow.isVisible().catch(() => false)) {
      await namedRow.click()
    } else {
      await newOption.click()
    }
    const nameInput = this.page.getByRole("textbox", {
      name: `${optionName} name`,
    })
    await nameInput.fill(name)
    await nameInput.press("Enter")
  }

  async openOptionInlineEdit(index0Based: number) {
    const optionName = `Option ${index0Based + 1}`
    const namedRow = this.page.getByText(
      new RegExp(`^${optionName}$|^New option$`),
    )
    await namedRow.first().click()
    await this.page
      .getByRole("textbox", { name: `${optionName} name` })
      .waitFor()
  }

  async fillOptionName(index0Based: number, name: string) {
    const nameInput = this.page.getByRole("textbox", {
      name: `Option ${index0Based + 1} name`,
    })
    await nameInput.fill(name)
  }

  async expectOptionNameError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible()
  }

  async expectFilterNameError(message: string | RegExp) {
    await expect(this.page.getByText(message)).toBeVisible()
  }

  async expectFilterNamedVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible()
  }

  async expectOptionNamedVisible(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toBeVisible()
  }

  async expectOptionNamedHidden(name: string) {
    await expect(this.page.getByText(name, { exact: true })).toHaveCount(0)
  }

  async expectFilterOrder(names: string[]) {
    const list = this.page.getByText(
      new RegExp(
        `^(${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`,
      ),
    )
    await expect(list).toHaveCount(names.length)
    for (const [index, name] of names.entries()) {
      await expect(list.nth(index)).toHaveText(name)
    }
  }

  async reorderFirstFilterDown() {
    await this.reorderFirstDraggableDown()
  }

  async reorderFirstOptionDown() {
    await this.reorderFirstDraggableDown()
  }

  async expectOptionOrder(names: string[]) {
    await this.expectFilterOrder(names)
  }

  async reorderFirstDraggableDown() {
    const handle = this.page
      .locator("[data-rbd-drag-handle-draggable-id]")
      .first()
    await handle.focus()
    await this.page.keyboard.press("Space")
    await this.page.keyboard.press("ArrowDown")
    await this.page.keyboard.press("Space")
  }

  async openOptionActions(index1Based: number) {
    await this.page
      .getByRole("button", { name: `Option ${index1Based} actions` })
      .click()
  }

  async openFilterActions(index1Based: number) {
    await this.page
      .getByRole("button", { name: `Filter ${index1Based} actions` })
      .click()
  }

  async clickDeleteOptionMenuItem() {
    await this.page.getByRole("menuitem", { name: /Delete option/i }).click()
    await expect(
      this.page.getByRole("dialog", { name: /Delete filter option/i }),
    ).toBeVisible()
  }

  async clickDeleteFilterMenuItem() {
    await this.page.getByRole("menuitem", { name: /Delete filter/i }).click()
    await expect(
      this.page.getByText(/You are deleting an entire filter\./i),
    ).toBeVisible()
  }

  deleteOptionDialog() {
    return this.page.getByRole("dialog")
  }

  async cancelDeleteOption() {
    await this.deleteOptionDialog()
      .getByRole("button", { name: /No, keep filter option/i })
      .click()
    await expect(this.deleteOptionDialog()).not.toBeVisible()
  }

  async confirmDeleteOption() {
    const dialog = this.deleteOptionDialog()
    await dialog
      .getByRole("checkbox", {
        name: /Yes, delete this filter option permanently/i,
      })
      .click()
    await dialog
      .getByRole("button", { name: /^Delete filter option$/i })
      .click()
    await expect(dialog).not.toBeVisible()
  }

  async cancelDeleteFilter() {
    await this.page.getByRole("button", { name: /No, keep filter/i }).click()
    await expect(
      this.page.getByText(/You are deleting an entire filter\./i),
    ).not.toBeVisible()
  }

  async confirmDeleteFilter() {
    await this.page
      .getByRole("checkbox", {
        name: /Yes, delete the entire filter permanently/i,
      })
      .click()
    await this.page.getByRole("button", { name: /^Delete filter$/i }).click()
    await expect(
      this.page.getByText(/You are deleting an entire filter\./i),
    ).not.toBeVisible()
  }

  async expectUsedOptionWarning(count: number) {
    const noun = count === 1 ? "1 item" : `${count} items`
    await expect(
      this.page.getByText(`This option is being used in ${noun}`),
    ).toBeVisible()
  }

  async expectUsedFilterWarning(count: number) {
    const noun = count === 1 ? "1 item" : `${count} items`
    await expect(
      this.page.getByText(`It’s being used on ${noun}`),
    ).toBeVisible()
  }

  async expectLargeUsageWarning() {
    await expect(
      this.page.getByText(/a large number of results/i),
    ).toBeVisible()
  }

  async expectUsageCountFallback() {
    await expect(
      this.page.getByText(
        /To undo this change, you will need to (create and re-assign this option|recreate this filter)/i,
      ),
    ).toBeVisible()
    await expect(
      this.page.getByText(/This option is being used in|It’s being used on/),
    ).toHaveCount(0)
  }

  drawerSaveButton() {
    return this.page
      .getByRole("button", { name: "Save changes" })
      .filter({ hasText: "Save changes" })
  }

  async expectDrawerSaveDisabled() {
    await expect(this.drawerSaveButton()).toBeDisabled()
  }

  async expectDrawerSaveEnabled() {
    await expect(this.drawerSaveButton()).toBeEnabled()
  }

  async saveFilters() {
    await this.drawerSaveButton().click()
    await expect(
      this.page.getByText(
        /Filter saved\. Remember to publish the changes so that other users can use the new filter options\./,
      ),
    ).toBeVisible()
  }

  async saveCollectionDisplay() {
    await this.drawerSaveButton().click()
    await expect(
      this.page.getByText(
        /Collection display saved\. Remember to publish the changes so that other users can see your updates\./,
      ),
    ).toBeVisible()
  }

  async fillCollectionSummary(summary: string) {
    await this.page.getByPlaceholder("Summary").fill(summary)
  }

  async expectCollectionSummary(summary: string) {
    await expect(this.page.getByPlaceholder("Summary")).toHaveValue(summary)
  }

  async chooseLayout(layout: "1-column" | "2-column") {
    await this.page.getByRole("radio", { name: layout }).click()
  }

  async chooseSortOrder(label: string) {
    await this.page.getByRole("combobox", { name: "Sort items by" }).click()
    await this.page.getByRole("option", { name: label }).click()
  }

  async setShowDate(show: boolean) {
    const toggle = this.page.getByLabel("Show date on all items")
    const isChecked = await toggle.isChecked()
    if (isChecked !== show) {
      await toggle.click()
    }
  }

  async enableThumbnails(fallback: "Use site logo" | "Use first image") {
    const thumbnailSwitch = this.page
      .getByText("Display thumbnail on all items")
      .locator("xpath=ancestor::div[1]/following-sibling::*")
      .getByRole("checkbox")
    if (!(await thumbnailSwitch.isChecked())) {
      await thumbnailSwitch.click()
    }
    await this.page.getByText(fallback, { exact: false }).click()
  }

  async expectLayoutSelected(layout: "1-column" | "2-column") {
    await expect(this.page.getByRole("radio", { name: layout })).toBeChecked()
  }

  async expectFilterPresentationSelected(presentation: "Pills" | "Plaintext") {
    await expect(
      this.page.getByRole("radio", { name: presentation }),
    ).toBeChecked()
  }

  async expectRequiredChecked(required: boolean) {
    const toggle = this.page.getByLabel("This filter is required")
    if (required) {
      await expect(toggle).toBeChecked()
    } else {
      await expect(toggle).not.toBeChecked()
    }
  }

  itemSaveButton() {
    return this.page.getByRole("button", { name: "Save", exact: true })
  }

  async expectItemSaveDisabled() {
    await expect(this.itemSaveButton()).toBeDisabled()
  }

  async expectItemSaveEnabled() {
    await expect(this.itemSaveButton()).toBeEnabled()
  }

  async saveCollectionLink() {
    await this.itemSaveButton().click()
    await expect(this.page.getByText("Link updated!")).toBeVisible()
  }

  async saveArticleHeaderChanges() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(
      this.page.getByText(
        "Changes saved. Click 'Publish' when you're ready to go live.",
      ),
    ).toBeVisible()
  }
}
