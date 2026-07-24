import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmailPattern,
  ensureUserOnboarded,
  expectUserRoleOnSite,
  seedLoggedInEditorOnSite,
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
    await deleteUsersByEmailPattern("e2e-logged-in-%@open.gov.sg")
  })

  test("admin can resend an invite to a pending user", async ({ page }) => {
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
    await users.clickResendInvite(inviteeEmail)

    // Assert
    await users.expectResendInviteToast(inviteeEmail)
  })

  test("admin does not see Resend invite for a user who has logged in", async ({
    page,
  }) => {
    // Arrange
    const { email } = await seedLoggedInEditorOnSite({ siteId })
    await expectUserRoleOnSite(siteId, email).toBe("Editor")
    const users = new UsersPO(page)
    await users.goto(siteId)

    // Assert
    await users.expectResendInviteNotVisible(email)
  })
})
