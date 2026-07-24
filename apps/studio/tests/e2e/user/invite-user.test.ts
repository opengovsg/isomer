import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { inviteCollaborator, openInviteModal } from "../fixtures/helpers"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

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

  const expectGrantedRole = (email: string) =>
    expect.poll(
      async () => {
        const row = await db
          .selectFrom("User as u")
          .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
          .where("u.email", "=", email)
          .where("rp.siteId", "=", siteId)
          .where("rp.deletedAt", "is", null)
          .select(["rp.role"])
          .executeTakeFirst()
        return row?.role ?? null
      },
      { timeout: 10_000 },
    )

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  const deleteUsersByEmail = async (emailPattern: string) => {
    const users = await db
      .selectFrom("User")
      .where("email", "like", emailPattern)
      .select(["id"])
      .execute()
    if (users.length === 0) return
    const ids = users.map((u) => u.id)
    await db
      .deleteFrom("ResourcePermission")
      .where("userId", "in", ids)
      .execute()
    await db.deleteFrom("User").where("id", "in", ids).execute()
  }

  test.afterEach(async () => {
    await deleteUsersByEmail("e2e-invitee-%@open.gov.sg")
    await deleteUsersByEmail("e2e-vendor-%@vendor.example.com")
    await db
      .deleteFrom("Whitelist")
      .where("email", "like", "e2e-vendor-%@vendor.example.com")
      .execute()
  })

  test("admin can invite a new collaborator as Editor", async ({ page }) => {
    const inviteeEmail = UNIQUE_INVITEE()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Editor",
      siteId,
    })
    await expectGrantedRole(inviteeEmail).toBe("Editor")
  })

  test("admin can invite a new collaborator as Publisher", async ({ page }) => {
    const inviteeEmail = UNIQUE_INVITEE()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Publisher",
      siteId,
    })
    await expectGrantedRole(inviteeEmail).toBe("Publisher")
  })

  test("admin can invite a new collaborator as Admin", async ({ page }) => {
    const inviteeEmail = UNIQUE_INVITEE()
    await inviteCollaborator(page, {
      email: inviteeEmail,
      role: "Admin",
      siteId,
    })
    await expectGrantedRole(inviteeEmail).toBe("Admin")
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
    await expectGrantedRole(vendorEmail).toBe("Admin")
  })

  test("admin cannot invite a non-whitelisted vendor collaborator", async ({
    page,
  }) => {
    const vendorEmail = UNIQUE_VENDOR()
    await openInviteModal(page, siteId)
    await page.getByLabel("Email address").fill(vendorEmail)

    await expect(
      page.getByText(
        "There are non-gov.sg domains that need to be whitelisted",
      ),
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole("button", { name: "Send invite" }),
    ).toBeDisabled()
  })

  test("admin cannot invite a non-whitelisted vendor collaborator, even as Admin", async ({
    page,
  }) => {
    const vendorEmail = UNIQUE_VENDOR()
    await openInviteModal(page, siteId)

    await page.getByRole("button", { name: /^Admin/ }).click()
    await page.getByLabel("Email address").fill(vendorEmail)

    await expect(page.getByRole("button", { name: /^Admin/ })).toBeEnabled()
    await expect(
      page.getByText(
        "There are non-gov.sg domains that need to be whitelisted",
      ),
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole("button", { name: "Send invite" }),
    ).toBeDisabled()
  })
})
