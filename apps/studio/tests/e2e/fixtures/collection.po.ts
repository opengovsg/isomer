import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

export class CollectionPO {
  constructor(private readonly page: Page) {}

  async gotoCollection(siteId: number, collectionId: string) {
    await this.page.goto(`/sites/${siteId}/collections/${collectionId}`)
    // Collection index is `/sites/:siteId/collections/:id` with no trailing segment.
    await this.page.waitForURL(
      new RegExp(`/sites/${siteId}/collections/${collectionId}$`),
    )
  }

  async openAddCollectionItem() {
    await this.page.getByRole("button", { name: "Add new item" }).click()
  }

  async selectCollectionItemType(type: "Page" | "Link or file") {
    await this.page.getByText(type, { exact: true }).click()
    await this.page.getByRole("button", { name: "Next: Page details" }).click()
  }

  async fillCollectionItemWizard(title: string) {
    // Page items label the field "Page title"; link items use "Item title".
    await this.page.getByLabel(/Page title|Item title/).fill(title)
    await this.page.getByRole("button", { name: "Start editing" }).click()
  }

  async expectOnCollectionItemEditor(
    siteId: number,
    kind: "page" | "link",
  ): Promise<string> {
    // Item wizards navigate to the page or link editor for the new collection child.
    const subpath = kind === "page" ? "pages" : "links"
    const pattern = new RegExp(`/sites/${siteId}/${subpath}/(\\d+)$`)
    await this.page.waitForURL(pattern)
    const itemId = this.page.url().match(pattern)?.[1]
    if (!itemId) {
      throw new Error(
        `Expected ${subpath} editor URL after wizard, got ${this.page.url()}`,
      )
    }
    return itemId
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

  private linkSaveButton() {
    return this.page.getByRole("button", { name: "Save", exact: true })
  }

  async expectLinkSaveDisabled() {
    await expect(this.linkSaveButton()).toBeDisabled()
  }

  async expectLinkSaveEnabled() {
    await expect(this.linkSaveButton()).toBeEnabled()
  }

  async clickLinkSave() {
    await this.linkSaveButton().click()
  }

  async openArticlePageHeader() {
    await this.page.getByRole("button", { name: "Article page header" }).click()
  }

  private pageSaveChangesButton() {
    return this.page.getByRole("button", {
      name: "Save changes",
      exact: true,
    })
  }

  async expectPageSaveChangesDisabled() {
    await expect(this.pageSaveChangesButton()).toBeDisabled()
  }

  async expectPageSaveChangesEnabled() {
    await expect(this.pageSaveChangesButton()).toBeEnabled()
  }

  async clickPageSaveChanges() {
    await this.pageSaveChangesButton().click()
  }
}
