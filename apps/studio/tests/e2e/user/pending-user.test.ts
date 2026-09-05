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
