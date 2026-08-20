import { expect, type Page } from "@playwright/test"

export type SiteAdminJsonField = "config" | "theme" | "navbar" | "footer"

export class SiteAdminPO {
  constructor(private readonly page: Page) {}

  async goto(siteId: number) {
    await this.page.goto(`/sites/${siteId}/admin`)
    await this.page.waitForURL(/\/admin$/)
    await expect(
      this.page.getByText("Manage site configurations"),
    ).toBeVisible()
  }

  jsonField(field: SiteAdminJsonField) {
    return this.page.locator(`textarea[name="${field}"]`)
  }

  saveButton() {
    return this.page.getByRole("button", { name: "Save settings" })
  }

  async fillJsonField(field: SiteAdminJsonField, value: string) {
    await this.jsonField(field).fill(value)
  }

  async clickSave() {
    await this.saveButton().click()
  }

  async reload() {
    await this.page.reload()
    await this.page.waitForURL(/\/admin$/)
    await expect(
      this.page.getByText("Manage site configurations"),
    ).toBeVisible()
  }

  async expectSavedToast() {
    await this.page
      .getByText("Saved site config!")
      .waitFor({ state: "visible" })
  }

  async expectSaveErrorToast() {
    await this.page
      .getByText("Error saving site config!")
      .waitFor({ state: "visible" })
  }

  async expectFieldError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible()
  }

  async clickSiteContentNav() {
    await this.page.getByRole("link", { name: "Site content" }).click()
  }

  async expectUnsavedChangesModal() {
    await expect(
      this.page.getByText("Leave this page without saving your settings?"),
    ).toBeVisible()
  }

  async clickGoBackToEditing() {
    await this.page.getByRole("button", { name: "Go back to editing" }).click()
  }

  async clickLeavePage() {
    await this.page
      .getByRole("button", { name: "Yes, leave this page" })
      .click()
  }
}
