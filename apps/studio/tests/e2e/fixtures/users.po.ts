import { expect, type Page } from "@playwright/test"

export class UsersPO {
  constructor(private readonly page: Page) {}

  async goto(siteId: number) {
    await this.page.goto(`/sites/${siteId}/users`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/users`))
  }

  async openAddUser() {
    await this.page.getByRole("button", { name: "Add new user" }).click()
  }

  async fillInviteForm(email: string, role: string) {
    await this.page.getByLabel("Email address").fill(email)
    await this.page
      .getByRole("button", { name: new RegExp(`^${role}`) })
      .click()
  }

  async sendInvite() {
    const sendBtn = this.page.getByRole("button", { name: "Send invite" })
    await expect(sendBtn).toBeEnabled({ timeout: 10_000 })
    await sendBtn.click()
    await expect(this.page.getByText(/Sent invite to/)).toBeVisible({
      timeout: 10_000,
    })
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
