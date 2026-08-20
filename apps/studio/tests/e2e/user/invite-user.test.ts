import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import {
  ensureUserOnboarded,
  uniqueInviteeEmail,
  uniqueVendorEmail,
} from "../fixtures/user"
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

  test("admin can invite a new collaborator as Editor", async ({ page }) => {
    const inviteeEmail = uniqueInviteeEmail()

    // Arrange / Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })

    // Assert
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })

  test("admin sees AddAdminWarning when selecting Admin role in invite modal", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act
    await openInviteModal(page, siteId)
    await users.selectInviteRole("Admin")

    // Assert
    await users.expectAddAdminWarningVisible()
  })

  test("admin cannot invite a non-whitelisted vendor collaborator", async ({
    page,
  }) => {
    const vendorEmail = uniqueVendorEmail()
    const users = new UsersPO(page)

    // Arrange / Act
    await openInviteModal(page, siteId)
    await users.fillInviteForm(vendorEmail, "Editor")

    // Assert
    await users.expectNonGovSgWhitelistWarning()
    await users.expectSendInviteDisabled()
  })
})
