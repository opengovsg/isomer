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

  async fillEmail(email: string) {
    await this.page.getByLabel("Email address").fill(email)
  }

  async selectRole(role: string) {
    // Role picker buttons are labelled "Editor — can edit…", "Publisher — can
    // publish…", etc. Anchor at ^role so "Editor" doesn't also match "Chief
    // Editor" if that role were added later.
    await this.roleButton(role).click()
  }

  roleButton(role: string) {
    return this.page.getByRole("button", { name: new RegExp(`^${role}`) })
  }

  async fillInviteForm(email: string, role: string) {
    await this.fillEmail(email)
    await this.selectRole(role)
  }

  async expectVendorWhitelistRequired() {
    await expect(
      this.page.getByText(
        "There are non-gov.sg domains that need to be whitelisted",
      ),
    ).toBeVisible({ timeout: 10_000 })
  }

  async expectSendInviteDisabled() {
    await expect(
      this.page.getByRole("button", { name: "Send invite" }),
    ).toBeDisabled()
  }

  async expectRoleEnabled(role: string) {
    await expect(this.roleButton(role)).toBeEnabled()
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
