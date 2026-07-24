import { test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmailPattern,
  ensureUserOnboarded,
  expectUserRoleOnSite,
  uniqueInviteeEmail,
} from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

test.describe("invite user", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

  const UNIQUE_VENDOR = () =>
    `e2e-vendor-${crypto.randomUUID().slice(0, 8)}@vendor.example.com`

  let siteId: number

  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
  })

  test.afterAll(async () => {
    await teardownE2ESite(siteId)
  })

  const whitelistVendor = async (email: string) => {
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 90)
    await db
      .insertInto("Whitelist")
      .values({ email: email.toLowerCase(), expiry })
      .onConflict((oc) =>
        oc
          .column("email")
          .doUpdateSet((eb) => ({ expiry: eb.ref("excluded.expiry") })),
      )
      .execute()
  }

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test.afterEach(async () => {
    await deleteUsersByEmailPattern("e2e-invitee-%@open.gov.sg")
    await deleteUsersByEmailPattern("e2e-vendor-%@vendor.example.com")
    await db
      .deleteFrom("Whitelist")
      .where("email", "like", "e2e-vendor-%@vendor.example.com")
      .execute()
  })

  test("admin can invite a new collaborator as Editor", async ({ page }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Editor")
  })

  test("admin can invite a new collaborator as Publisher", async ({ page }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Publisher",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Publisher")
  })

  test("admin can invite a new collaborator as Admin", async ({ page }) => {
    const inviteeEmail = uniqueInviteeEmail()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Admin",
      siteId,
    })
    await expectUserRoleOnSite(siteId, inviteeEmail).toBe("Admin")
  })

  test("admin can invite a whitelisted vendor collaborator as Admin", async ({
    page,
  }) => {
    const vendorEmail = UNIQUE_VENDOR()
    await whitelistVendor(vendorEmail)
    await inviteCollaborator(page, {
      email: vendorEmail,
      role: "Admin",
      siteId,
    })
    await expectUserRoleOnSite(siteId, vendorEmail).toBe("Admin")
  })

  test("admin cannot invite a non-whitelisted vendor collaborator", async ({
    page,
  }) => {
    const vendorEmail = UNIQUE_VENDOR()
    const users = new UsersPO(page)
    await openInviteModal(page, siteId)
    await users.fillInviteForm(vendorEmail, "Editor")
    await users.expectNonGovSgWhitelistWarning()
    await users.expectSendInviteDisabled()
  })

  test("admin cannot invite a non-whitelisted vendor collaborator, even as Admin", async ({
    page,
  }) => {
    const vendorEmail = UNIQUE_VENDOR()
    const users = new UsersPO(page)
    await openInviteModal(page, siteId)
    await users.selectInviteRole("Admin")
    await users.fillInviteEmail(vendorEmail)
    await users.expectInviteRoleEnabled("Admin")
    await users.expectNonGovSgWhitelistWarning()
    await users.expectSendInviteDisabled()
  })
})
