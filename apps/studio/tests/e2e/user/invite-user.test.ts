import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import { deleteUsersByEmail, ensureUserOnboarded } from "../fixtures/user"
import { expectUserRoleOnSite } from "../fixtures/user.expect"
import { uniqueInviteeEmail, uniqueVendorEmail } from "../fixtures/user.seed"
import { UsersPO } from "../fixtures/users.po"
import {
  deleteWhitelistedVendorEmails,
  whitelistVendorEmail,
} from "../fixtures/whitelist.seed"

let siteId: number
let inviteeEmail: string | undefined
let vendorEmail: string | undefined

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteUsersByEmail(inviteeEmail, vendorEmail)
    await deleteWhitelistedVendorEmails(vendorEmail)
  })

  test("admin can invite a new collaborator as Editor", async ({ page }) => {
    inviteeEmail = uniqueInviteeEmail()

    // Arrange / Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })

    // Assert
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })

  test("admin can invite a new collaborator as Publisher", async ({ page }) => {
    inviteeEmail = uniqueInviteeEmail()

    // Arrange / Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Publisher",
      siteId,
    })

    // Assert
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")
  })

  test("admin can invite a new collaborator as Admin", async ({ page }) => {
    inviteeEmail = uniqueInviteeEmail()

    // Arrange / Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Admin",
      siteId,
    })

    // Assert
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Admin")
  })

  test("admin can invite a whitelisted vendor collaborator as Admin", async ({
    page,
  }) => {
    vendorEmail = uniqueVendorEmail()

    // Arrange
    await whitelistVendorEmail(vendorEmail)

    // Act
    await inviteCollaborator(page, {
      email: vendorEmail,
      role: "Admin",
      siteId,
    })

    // Assert
    await expectUserRoleOnSite(siteId, vendorEmail).toBe("Admin")
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
    vendorEmail = uniqueVendorEmail()
    const users = new UsersPO(page)

    // Arrange / Act
    await openInviteModal(page, siteId)
    await users.fillInviteForm(vendorEmail, "Editor")

    // Assert
    await users.expectNonGovSgWhitelistWarning()
    await users.expectSendInviteDisabled()
  })

  test("admin cannot invite a non-whitelisted vendor collaborator, even as Admin", async ({
    page,
  }) => {
    vendorEmail = uniqueVendorEmail()
    const users = new UsersPO(page)

    // Arrange / Act
    await openInviteModal(page, siteId)
    await users.selectInviteRole("Admin")
    await users.fillInviteEmail(vendorEmail)

    // Assert
    await users.expectInviteRoleEnabled("Admin")
    await users.expectNonGovSgWhitelistWarning()
    await users.expectSendInviteDisabled()
  })
})
