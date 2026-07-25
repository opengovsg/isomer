import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { inviteCollaborator, openInviteModal } from "~e2e/fixtures/helpers"
import { UsersPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import {
  deleteUsersByEmail,
  ensureUserOnboarded,
  expectUserRoleOnSite,
  uniqueInviteeEmail,
} from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number
let inviteeEmail: string

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteUsersByEmail(inviteeEmail)
  })

  test("admin cannot invite a user who already has site access", async ({
    page,
  }) => {
    inviteeEmail = uniqueInviteeEmail()

    // Arrange
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
    const users = new UsersPO(page)
    await openInviteModal(page, siteId)

    // Act
    await users.fillInviteForm(inviteeEmail, "Publisher")
    await users.submitInvite()

    // Assert
    await users.expectCreateUserFailed(
      "User already has permission for this site",
    )
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })
})
