import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmailPattern,
  ensureUserOnboarded,
  expectUserAbsentOnSite,
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

  test("admin can remove a collaborator via RemoveUserModal", async ({
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
    await users.expectUserInTable(inviteeEmail)

    await users.openRemoveUserAccess(inviteeEmail)
    await users.confirmRemoveUser()
    await users.expectRemovedFromSiteToast(inviteeEmail)
    await users.expectUserNotInTable(inviteeEmail)
    await expectUserAbsentOnSite(siteId, inviteeEmail).toBeNull()
  })

  test("admin can cancel RemoveUserModal without removing the collaborator", async ({
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
    await users.openRemoveUserAccess(inviteeEmail)
    await users.cancelRemoveUser()

    await users.expectUserInTable(inviteeEmail)
    await users.expectUserRole(inviteeEmail, "Editor")
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })
})
