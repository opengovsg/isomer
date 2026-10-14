import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { inviteCollaborator } from "~e2e/fixtures/helpers"
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

  test("admin can promote an Editor to Publisher via EditUserModal", async ({
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
    await users.goto(siteId)

    // Act
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Publisher")
    await users.saveUserChanges()

    // Assert
    await users.expectUserRole(inviteeEmail, "Publisher")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")
  })

  test("admin can demote a Publisher to Editor via EditUserModal", async ({
    page,
  }) => {
    inviteeEmail = uniqueInviteeEmail()

    // Arrange
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Publisher",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")
    const users = new UsersPO(page)
    await users.goto(siteId)

    // Act
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Editor")
    await users.saveUserChanges()

    // Assert
    await users.expectUserRole(inviteeEmail, "Editor")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })

  test("admin can promote a collaborator to Admin via EditUserModal", async ({
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
    await users.goto(siteId)

    // Act
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Admin")
    await users.expectAddAdminWarningVisible()
    await users.saveUserChanges()

    // Assert
    await users.expectUserRole(inviteeEmail, "Admin")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Admin")
  })

  test("admin can cancel EditUserModal without changing the collaborator role", async ({
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
