import { test } from "@playwright/test"
import { SINGPASS_DISABLED_ERROR_MESSAGE } from "~/constants/customErrorMessage"
import { IS_SINGPASS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator } from "../fixtures/helpers"
import {
  enableGrowthBookFeature,
  resetGrowthBookPage,
} from "../fixtures/network"
import { provisionE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmail,
  ensureUserOnboarded,
  expectUserRoleOnSite,
  uniqueInviteeEmail,
} from "../fixtures/user"
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

  test("add, edit, remove, and resend controls are disabled with an explanation when Singpass is unavailable", async ({
    page,
  }) => {
    inviteeEmail = uniqueInviteeEmail()

    // Arrange: invite a pending user while Singpass is enabled (the default)
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
    const users = new UsersPO(page)

    // Act: disable Singpass and reload the users page
    await enableGrowthBookFeature(page, IS_SINGPASS_ENABLED_FEATURE_KEY, false)
    await resetGrowthBookPage(page)
    await users.goto(siteId)

    // Assert
    await users.expectCannotAddNewUser()
    await users.expectAddNewUserDisabledExplanation(
      SINGPASS_DISABLED_ERROR_MESSAGE,
    )
    await users.expectAllRowActionsDisabled(inviteeEmail)
  })
})
