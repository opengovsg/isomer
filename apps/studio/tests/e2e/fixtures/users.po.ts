import { expect, type Page } from "@playwright/test"

export class UsersPO {
  constructor(private readonly page: Page) {}

  async goto(siteId: number) {
    await this.page.goto(`/sites/${siteId}/users`)
    await this.page.waitForURL(new RegExp(`/sites/${siteId}/users`))
  }

  addNewUserButton() {
    return this.page.getByRole("button", { name: "Add new user" })
  }

  async expectCannotAddNewUser() {
    await expect(this.addNewUserButton()).toBeDisabled()
  }

  async openAddUser() {
    await this.addNewUserButton().click()
  }

  async selectInviteRole(role: string) {
    await this.page
      .getByRole("button", { name: new RegExp(`^${role}`) })
      .click()
  }

  async fillInviteForm(email: string, role: string) {
    await this.fillInviteEmail(email)
    await this.selectInviteRole(role)
  }

  async fillInviteEmail(email: string) {
    await this.page.getByLabel("Email address").fill(email)
  }

  async expectInviteRoleEnabled(role: string) {
    await expect(
      this.page.getByRole("button", { name: new RegExp(`^${role}`) }),
    ).toBeEnabled()
  }

  async sendInvite() {
    const sendBtn = this.page.getByRole("button", { name: "Send invite" })
    await expect(sendBtn).toBeEnabled({ timeout: 10_000 })
    await sendBtn.click()
    await expect(this.page.getByText(/Sent invite to/)).toBeVisible({
      timeout: 10_000,
    })
  }

  async expectNonGovSgWhitelistWarning() {
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

  /**
   * Opens the row actions menu for the user whose email is shown in the table.
   * Locates by email (stable) rather than display name (local-part for invites).
   */
  async openUserMenu(email: string) {
    const row = this.page.getByRole("row").filter({ hasText: email })
    await row.getByRole("button", { name: /Options for/ }).click()
  }

  async openEditUser(email: string) {
    await this.openUserMenu(email)
    await this.page.getByRole("menuitem", { name: "Edit user" }).click()
  }

  async selectRoleInEditModal(role: string) {
    await this.page.getByRole("button", { name: `${role} role` }).click()
  }

  async saveUserChanges() {
    await this.page.getByRole("button", { name: "Save changes" }).click()
    await expect(this.page.getByText("Changes saved!")).toBeVisible({
      timeout: 10_000,
    })
  }

  async openRemoveUserAccess(email: string) {
    await this.openUserMenu(email)
    await this.page
      .getByRole("menuitem", { name: "Remove user access" })
      .click()
  }

  async confirmRemoveUser() {
    await this.page.getByRole("button", { name: "Remove user" }).click()
  }

  async expectRemovedFromSiteToast(email: string) {
    await expect(
      this.page.getByText(`Removed ${email} from site.`),
    ).toBeVisible({ timeout: 10_000 })
  }

  async clickResendInvite(email: string) {
    await this.openUserMenu(email)
    await this.page.getByRole("menuitem", { name: "Resend invite" }).click()
  }

  async expectResendInviteToast(email: string) {
    await expect(this.page.getByText(`Invite resent to ${email}`)).toBeVisible({
      timeout: 10_000,
    })
  }

  async expectUserInTable(email: string) {
    await expect(
      this.page.getByRole("row").filter({ hasText: email }),
    ).toBeVisible()
  }

  async expectUserNotInTable(email: string) {
    await expect(
      this.page.getByRole("row").filter({ hasText: email }),
    ).toHaveCount(0)
  }

  async expectUserRole(email: string, role: string) {
    const row = this.page.getByRole("row").filter({ hasText: email })
    await expect(row).toContainText(role)
  }
}
