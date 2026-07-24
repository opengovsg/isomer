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

  async expectReadOnlyCollaboratorsDescription() {
    await expect(
      this.page.getByText("View users that work with you on this site."),
    ).toBeVisible()
  }

  async expectNoRowActionsMenus() {
    await expect(
      this.page.getByRole("button", { name: /Options for/ }),
    ).toHaveCount(0)
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

  async submitInvite() {
    await this.page.getByRole("button", { name: "Send invite" }).click()
  }

  async expectCreateUserFailed(description: string | RegExp) {
    await expect(this.page.getByText("Failed to create user")).toBeVisible({
      timeout: 10_000,
    })
    await expect(this.page.getByText(description)).toBeVisible({
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

  userRow(email: string) {
    return this.page.getByRole("row").filter({ hasText: email })
  }

  async expectNoActionsMenuForUser(email: string) {
    await expect(
      this.userRow(email).getByRole("button", { name: /Options for/ }),
    ).toHaveCount(0)
  }

  async openEditUser(email: string) {
    await this.openUserMenu(email)
    await this.page.getByRole("menuitem", { name: "Edit user" }).click()
  }

  async selectRoleInEditModal(role: string) {
    await this.page.getByRole("button", { name: `${role} role` }).click()
  }

  async expectAddAdminWarningVisible() {
    await expect(
      this.page.getByText(
        "You are adding a new admin to the website. An admin can make any change to the site content, settings, and users.",
      ),
    ).toBeVisible()
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

  async cancelRemoveUser() {
    await this.page.getByRole("button", { name: "No, cancel" }).click()
  }

  async cancelEditUser() {
    await this.page.getByRole("button", { name: "Cancel" }).click()
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

  async expectResendInviteNotVisible(email: string) {
    await this.openUserMenu(email)
    await expect(
      this.page.getByRole("menuitem", { name: "Resend invite" }),
    ).not.toBeVisible()
  }

  async expectResendInviteToast(email: string) {
    await expect(this.page.getByText(`Invite resent to ${email}`)).toBeVisible({
      timeout: 10_000,
    })
  }

  async expectPendingInviteStatus(email: string) {
    const row = this.userRow(email)
    await expect(row.getByText("Waiting to accept invite")).toBeVisible()
  }

  async clickIsomerAdminsTab() {
    await this.page.getByRole("tab", { name: /Isomer admins/ }).click()
  }

  async expectIsomerAdminBanner() {
    await expect(
      this.page.getByText(
        "All Isomer Admins have access to your site and may make changes on your behalf.",
      ),
    ).toBeVisible()
  }

  async expectUserInTable(email: string) {
    await expect(this.userRow(email)).toBeVisible()
  }

  async expectUserNotInTable(email: string) {
    await expect(this.userRow(email)).toHaveCount(0)
  }

  async expectUserRole(email: string, role: string) {
    await expect(this.userRow(email)).toContainText(role)
  }
}
