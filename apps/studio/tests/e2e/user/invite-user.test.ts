import { expect, test, type Page } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"
import { type RoleType } from "~prisma/generated/generatedEnums"

import { storageStateFor, TEST_EMAILS } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"

const UNIQUE_INVITEE = () =>
  `e2e-invitee-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

// Non-gov.sg domain — i.e. a "vendor" collaborator. Vendors can only be
// added if their email is whitelisted (any whitelist entry, temporary or
// permanent, is sufficient for any role including Admin).
const UNIQUE_VENDOR = () =>
  `e2e-vendor-${crypto.randomUUID().slice(0, 8)}@vendor.example.com`

// Whitelist a vendor email so the whitelist gate isn't the blocker. A future
// expiry marks it as a (temporary) vendor entry rather than a permanent one;
// isEmailWhitelisted treats both as equally valid.
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

const openInviteModal = async (page: Page) => {
  await page.goto(`/sites/${getSeedSiteId()}/users`)
  await page.getByRole("button", { name: "Add new user" }).click()
}

// Drives the modal happy path: fill email, pick role, wait for the whitelist
// check to enable Send, then submit.
const inviteCollaborator = async (
  page: Page,
  { email, role }: { email: string; role: keyof typeof RoleType },
) => {
  await openInviteModal(page)
  await page.getByLabel("Email address").fill(email)
  // RoleBoxes are clickable cards; their accessible name is "<Role> role".
  await page.getByRole("button", { name: new RegExp(`^${role}`) }).click()

  const sendBtn = page.getByRole("button", { name: "Send invite" })
  // The form debounces email + runs a whitelist check before enabling Send.
  await expect(sendBtn).toBeEnabled({ timeout: 10_000 })
  await sendBtn.click()
  await expect(page.getByText(/Sent invite to/)).toBeVisible({
    timeout: 10_000,
  })
}

// Polls the DB for the active permission role granted to an invitee on the
// seed site.
const expectGrantedRole = (email: string) =>
  expect.poll(
    async () => {
      const row = await db
        .selectFrom("User as u")
        .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
        .where("u.email", "=", email)
        .where("rp.siteId", "=", getSeedSiteId())
        .where("rp.deletedAt", "is", null)
        .select(["rp.role"])
        .executeTakeFirst()
      return row?.role ?? null
    },
    { timeout: 10_000 },
  )

test.use({ storageState: storageStateFor("admin") })

test.beforeEach(async () => {
  // Welcome-modal workaround (see settings tests for rationale).
  await db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678" })
    .where("email", "=", TEST_EMAILS.admin)
    .execute()
})

// Hard-delete e2e users matching `emailPattern` + their permissions so re-runs
// are clean. ResourcePermission has FK to User so delete permissions first.
const deleteUsersByEmail = async (emailPattern: string) => {
  const users = await db
    .selectFrom("User")
    .where("email", "like", emailPattern)
    .select(["id"])
    .execute()
  if (users.length === 0) return
  const ids = users.map((u) => u.id)
  await db.deleteFrom("ResourcePermission").where("userId", "in", ids).execute()
  await db.deleteFrom("User").where("id", "in", ids).execute()
}

test.afterEach(async () => {
  await deleteUsersByEmail("e2e-invitee-%@open.gov.sg")
  // Cleanup for vendor users created by the positive vendor-invite test.
  await deleteUsersByEmail("e2e-vendor-%@vendor.example.com")
  // Remove any vendor whitelist entries created by these tests.
  await db
    .deleteFrom("Whitelist")
    .where("email", "like", "e2e-vendor-%@vendor.example.com")
    .execute()
})

test("admin can invite a new collaborator as Editor", async ({ page }) => {
  const inviteeEmail = UNIQUE_INVITEE()
  await inviteCollaborator(page, { email: inviteeEmail, role: "Editor" })
  await expectGrantedRole(inviteeEmail).toBe("Editor")
})

test("admin can invite a new collaborator as Publisher", async ({ page }) => {
  const inviteeEmail = UNIQUE_INVITEE()
  await inviteCollaborator(page, { email: inviteeEmail, role: "Publisher" })
  await expectGrantedRole(inviteeEmail).toBe("Publisher")
})

test("admin can invite a new collaborator as Admin", async ({ page }) => {
  // A gov.sg invitee is whitelisted by the `.gov.sg` suffix and eligible for
  // the Admin role.
  const inviteeEmail = UNIQUE_INVITEE()
  await inviteCollaborator(page, { email: inviteeEmail, role: "Admin" })
  await expectGrantedRole(inviteeEmail).toBe("Admin")
})

test("admin can invite a whitelisted vendor collaborator as Admin", async ({
  page,
}) => {
  const vendorEmail = UNIQUE_VENDOR()
  // A temporary (vendor) whitelist grant is now sufficient for Admin, same
  // as a permanent one.
  await whitelistVendor(vendorEmail)
  await inviteCollaborator(page, { email: vendorEmail, role: "Admin" })
  await expectGrantedRole(vendorEmail).toBe("Admin")
})

test("admin cannot invite a non-whitelisted vendor collaborator", async ({
  page,
}) => {
  const vendorEmail = UNIQUE_VENDOR()
  await openInviteModal(page)
  await page.getByLabel("Email address").fill(vendorEmail)

  // Default role is Editor, so the Admin restriction isn't in play — the sole
  // blocker is the missing whitelist entry.
  await expect(
    page.getByText("There are non-gov.sg domains that need to be whitelisted"),
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole("button", { name: "Send invite" })).toBeDisabled()
})

test("admin cannot invite a non-whitelisted vendor collaborator, even as Admin", async ({
  page,
}) => {
  const vendorEmail = UNIQUE_VENDOR()
  await openInviteModal(page)

  // Selecting Admin has no whitelist-specific effect of its own -- there's no
  // distinction between Admin and any other role. The role box is never
  // disabled; the block comes purely from the general "needs whitelisting"
  // gate that applies to every role.
  await page.getByRole("button", { name: /^Admin/ }).click()
  await page.getByLabel("Email address").fill(vendorEmail)

  await expect(page.getByRole("button", { name: /^Admin/ })).toBeEnabled()
  await expect(
    page.getByText("There are non-gov.sg domains that need to be whitelisted"),
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole("button", { name: "Send invite" })).toBeDisabled()
})
