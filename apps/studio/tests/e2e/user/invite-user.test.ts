import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"
import {
  deleteUsersByEmailLike,
  deleteWhitelistByEmailLike,
  getGrantedRole,
  whitelistVendorEmail,
} from "../fixtures/user.db"

test.describe("invite user", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

  const UNIQUE_INVITEE = () =>
    `e2e-invitee-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

  const UNIQUE_VENDOR = () =>
    `e2e-vendor-${crypto.randomUUID().slice(0, 8)}@vendor.example.com`

  let siteId: number

  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  const expectGrantedRole = (email: string) =>
    expect.poll(
      async () => (await getGrantedRole({ siteId, email }))?.role ?? null,
      { timeout: 10_000 },
    )

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteUsersByEmailLike("e2e-invitee-%@open.gov.sg")
    await deleteUsersByEmailLike("e2e-vendor-%@vendor.example.com")
    await deleteWhitelistByEmailLike("e2e-vendor-%@vendor.example.com")
  })

  test("admin can invite a new collaborator as Editor", async ({ page }) => {
    // Arrange
    const inviteeEmail = UNIQUE_INVITEE()

    // Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })

    // Assert
    await expectGrantedRole(inviteeEmail).toBe("Editor")
  })

  test("admin can invite a new collaborator as Publisher", async ({ page }) => {
    // Arrange
    const inviteeEmail = UNIQUE_INVITEE()

    // Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Publisher",
      siteId,
    })

    // Assert
    await expectGrantedRole(inviteeEmail).toBe("Publisher")
  })

  test("admin can invite a new collaborator as Admin", async ({ page }) => {
    // Arrange
    const inviteeEmail = UNIQUE_INVITEE()

    // Act
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Admin",
      siteId,
    })

    // Assert
    await expectGrantedRole(inviteeEmail).toBe("Admin")
  })

  test("admin can invite a whitelisted vendor collaborator as Admin", async ({
    page,
  }) => {
    // Arrange
    const vendorEmail = UNIQUE_VENDOR()
    await whitelistVendorEmail(vendorEmail)

    // Act
    await inviteCollaborator(page, {
      email: vendorEmail,
      role: "Admin",
      siteId,
    })

    // Assert
    await expectGrantedRole(vendorEmail).toBe("Admin")
  })

  test("admin cannot invite a non-whitelisted vendor collaborator", async ({
    page,
  }) => {
    // Arrange
    const vendorEmail = UNIQUE_VENDOR()
    const users = await openInviteModal(page, siteId)
    await users.fillEmail(vendorEmail)

    // Assert
    await users.expectVendorWhitelistRequired()
    await users.expectSendInviteDisabled()
  })

  test("admin cannot invite a non-whitelisted vendor collaborator, even as Admin", async ({
    page,
  }) => {
    // Arrange
    const vendorEmail = UNIQUE_VENDOR()
    const users = await openInviteModal(page, siteId)
    await users.selectRole("Admin")
    await users.fillEmail(vendorEmail)

    // Assert
    await users.expectRoleEnabled("Admin")
    await users.expectVendorWhitelistRequired()
    await users.expectSendInviteDisabled()
  })
})
