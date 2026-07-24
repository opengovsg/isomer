import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmailPattern,
  deleteWhitelistedVendorsByPattern,
  ensureUserOnboarded,
  expectUserRoleOnSite,
  uniqueInviteeEmail,
  uniqueVendorEmail,
  whitelistVendorEmail,
} from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

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
    await deleteUsersByEmailPattern("e2e-vendor-%@vendor.example.com")
    await deleteWhitelistedVendorsByPattern("e2e-vendor-%@vendor.example.com")
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

  test("admin can invite a new collaborator as Publisher", async ({ page }) => {
    const inviteeEmail = uniqueInviteeEmail()

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
    const inviteeEmail = uniqueInviteeEmail()

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
    const vendorEmail = uniqueVendorEmail()

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
    const vendorEmail = uniqueVendorEmail()
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
    const vendorEmail = uniqueVendorEmail()
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
