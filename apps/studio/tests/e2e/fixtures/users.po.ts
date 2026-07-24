import type { Page } from "@playwright/test"

export class UsersPO {
  constructor(private readonly page: Page) {}

  async goto(siteId: number) {
    await this.page.goto(`/sites/${siteId}/users`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/users`))
  }

  async openAddUser() {
    await this.page.getByRole("button", { name: "Add new user" }).click()
  }

  /**
   * Opens the row actions menu for the user whose email is shown in the table.
   * Locates by email (stable) rather than display name (local-part for invites).
   */
  async openUserMenu(email: string) {
    const row = this.page.getByRole("row").filter({ hasText: email })
    await row.getByRole("button", { name: /Options for/ }).click()
  }
}
