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

  test("add, edit, remove, and resend controls are disabled with an explanation when Singpass is unavailable", async ({
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

    // Act
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
