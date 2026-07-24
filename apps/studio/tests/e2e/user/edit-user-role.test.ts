import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmailPattern,
  ensureUserOnboarded,
  expectUserRoleOnSite,
  uniqueInviteeEmail,
} from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.afterAll(async () => {
    await teardownE2ESite(siteId)
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteUsersByEmailPattern("e2e-invitee-%@open.gov.sg")
  })

  test("admin can promote an Editor to Publisher via EditUserModal", async ({
    page,
  }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")

    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Publisher")
    await users.saveUserChanges()

    await users.expectUserRole(inviteeEmail, "Publisher")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")
  })

  test("admin can demote a Publisher to Editor via EditUserModal", async ({
    page,
  }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Publisher",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")

    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Editor")
    await users.saveUserChanges()

    await users.expectUserRole(inviteeEmail, "Editor")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })

  test("admin can promote a collaborator to Admin via EditUserModal", async ({
    page,
  }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")

    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Admin")
    await users.expectAddAdminWarningVisible()
    await users.saveUserChanges()

    await users.expectUserRole(inviteeEmail, "Admin")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Admin")
  })

  test("admin can cancel EditUserModal without changing the collaborator role", async ({
    page,
  }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")

    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.openEditUser(inviteeEmail)
    await users.selectRoleInEditModal("Publisher")
    await users.cancelEditUser()

    await users.expectUserRole(inviteeEmail, "Editor")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })
})
