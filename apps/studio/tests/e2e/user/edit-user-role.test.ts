import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded, uniqueInviteeEmail } from "../fixtures/user"
import { expectUserRoleOnSite } from "../fixtures/user-expect"
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

  test("admin can promote an Editor to Publisher via EditUserModal", async ({
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
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Publisher")
    await users.saveUserChanges()

    // Assert
    await users.expectUserRole(inviteeEmail, "Publisher")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")
  })

  test("admin can cancel EditUserModal without changing the collaborator role", async ({
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
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Publisher")
    await users.cancelEditUser()

    // Assert
    await users.expectUserRole(inviteeEmail, "Editor")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })
})
