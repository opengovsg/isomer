import { test } from "@playwright/test"
import crypto from "crypto"
import {
  setupEditorPermissions,
  setupUser,
} from "tests/integration/helpers/seed"
import { MOCK_STORY_DATE } from "tests/msw/constants"
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

const loggedInUserEmail = () =>
  `e2e-logged-in-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

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
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")

    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.clickResendInvite(inviteeEmail)
    await users.expectResendInviteToast(inviteeEmail)
  })

  test("admin does not see Resend invite for a user who has logged in", async ({
    page,
  }) => {
    const email = loggedInUserEmail()
    const user = await setupUser({
      email,
      name: "Logged In User",
      lastLoginAt: MOCK_STORY_DATE,
    })
    await setupEditorPermissions({ userId: user.id, siteId })
    await expectUserRoleOnSite(siteId, email).toBe("Editor")

    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.expectResendInviteNotVisible(email)
  })
})
