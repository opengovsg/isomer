import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
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

  test("pending invitee shows Waiting to accept invite in the table", async ({
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

    // Act
    await users.goto(siteId)

    // Assert
    await users.expectPendingInviteStatus(inviteeEmail)
  })
})
