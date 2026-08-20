import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded, uniqueInviteeEmail } from "../fixtures/user"
import {
  expectUserAbsentOnSite,
  expectUserRoleOnSite,
} from "../fixtures/user-expect"
import { UsersPO } from "../fixtures/users.po"

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("admin can remove a collaborator via RemoveUserModal", async ({
    page,
  }) => {
    const inviteeEmail = uniqueInviteeEmail()

    // Arrange
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.expectUserInTable(inviteeEmail)

    // Act
    await users.openRemoveUserAccess(inviteeEmail)
    await users.confirmRemoveUser()

    // Assert
    await users.expectRemovedFromSiteToast(inviteeEmail)
    await users.expectUserNotInTable(inviteeEmail)
    await expectUserAbsentOnSite(siteId, inviteeEmail).toBeNull()
  })

  test("admin can cancel RemoveUserModal without removing the collaborator", async ({
    page,
  }) => {
    const inviteeEmail = uniqueInviteeEmail()

    // Arrange
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
    const users = new UsersPO(page)
    await users.goto(siteId)

    // Act
    await users.openRemoveUserAccess(inviteeEmail)
    await users.cancelRemoveUser()

    // Assert
    await users.expectUserInTable(inviteeEmail)
    await users.expectUserRole(inviteeEmail, "Editor")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })
})
