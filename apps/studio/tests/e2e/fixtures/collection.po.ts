import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

export class CollectionPO {
  constructor(private readonly page: Page) {}

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

  /**
   * The JsonFormsTaggedControl error shown under a required tag category
   * with no option selected.
   */
  async expectRequiredTagError() {
    await expect(
      this.page.getByText("At least one option must be selected"),
    ).toBeVisible()
  }

  /** New collection editing experience root section (feature flag on). */
  async expectManageCollectionVisible() {
    await expect(this.page.getByText("Manage Collection")).toBeVisible()
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

  async openFilters() {
    await this.page.getByRole("button", { name: /Filters/i }).click()
  }

  async expectManageFiltersDrawerOpen() {
    await expect(this.page.getByText("Manage filters")).toBeVisible()
  }
}
