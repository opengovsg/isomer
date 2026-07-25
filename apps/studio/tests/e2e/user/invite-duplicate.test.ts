import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import { deleteUsersByEmail, ensureUserOnboarded } from "../fixtures/user"
import { expectUserRoleOnSite } from "../fixtures/user.expect"
import { uniqueInviteeEmail } from "../fixtures/user.seed"
import { UsersPO } from "../fixtures/users.po"

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
