import { expect } from "@playwright/test"
import crypto from "crypto"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupUser,
} from "tests/integration/helpers/seed"
import { MOCK_STORY_DATE } from "tests/msw/constants"
import { db } from "~/server/modules/database"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

const E2E_USER_NAME = "test-e2e"
const E2E_USER_PHONE = "82345678"

export const uniqueInviteeEmail = () =>
  `e2e-invitee-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

export const uniqueVendorEmail = () =>
  `e2e-vendor-${crypto.randomUUID().slice(0, 8)}@vendor.example.com`

export const uniqueLoggedInUserEmail = () =>
  `e2e-logged-in-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

export const uniqueIsomerAdminEmail = () =>
  `e2e-isomer-admin-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

/** Delete listed users and their permission/admin rows.
 * Exact emails only; a LIKE on e2e-invitee-% can wipe another test's user
 * when fullyParallel is on.
 */
export const deleteUsersByEmail = async (...emails: (string | undefined)[]) => {
  const list = emails.filter((email): email is string => !!email)
  if (list.length === 0) return

  const users = await db
    .selectFrom("User")
    .where("email", "in", list)
    .select(["id"])
    .execute()
  if (users.length === 0) return

  const ids = users.map((u) => u.id)
  await db.deleteFrom("IsomerAdmin").where("userId", "in", ids).execute()
  await db.deleteFrom("ResourcePermission").where("userId", "in", ids).execute()
  await db.deleteFrom("User").where("id", "in", ids).execute()
}

export const deleteWhitelistedVendorEmails = async (
  ...emails: (string | undefined)[]
) => {
  const list = emails.filter((email): email is string => !!email)
  if (list.length === 0) return
  await db.deleteFrom("Whitelist").where("email", "in", list).execute()
}

export const whitelistVendorEmail = async (email: string) => {
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

export const seedLoggedInEditorOnSite = async ({
  siteId,
  email = uniqueLoggedInUserEmail(),
}: {
  siteId: number
  email?: string
}) => {
  const user = await setupUser({
    email,
    name: "Logged In User",
    lastLoginAt: MOCK_STORY_DATE,
  })
  await setupEditorPermissions({ userId: user.id, siteId })
  return { email, userId: user.id }
}

export const seedIsomerAdminOnSite = async ({
  siteId,
  email = uniqueIsomerAdminEmail(),
}: {
  siteId: number
  email?: string
}) => {
  const user = await setupUser({
    email,
    name: "E2E Isomer Admin",
    lastLoginAt: MOCK_STORY_DATE,
  })
  await setupAdminPermissions({ userId: user.id, siteId })
  await db
    .insertInto("IsomerAdmin")
    .values({
      userId: user.id,
      role: IsomerAdminRole.Core,
      expiry: null,
    })
    .execute()
  return { email, userId: user.id }
}

export const expectUserRoleOnSite = (siteId: number, email: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("User as u")
      .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
      .where("u.email", "=", email)
      .where("rp.siteId", "=", siteId)
      .where("rp.deletedAt", "is", null)
      .select(["rp.role"])
      .executeTakeFirst()
    return row?.role ?? null
  })

/** Active sitewide permission absent (e.g. after remove-user). */
export const expectUserAbsentOnSite = (siteId: number, email: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("User as u")
      .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
      .where("u.email", "=", email)
      .where("rp.siteId", "=", siteId)
      .where("rp.deletedAt", "is", null)
      .select(["rp.id"])
      .executeTakeFirst()
    return row ?? null
  })

/** Skip the welcome modal by ensuring name + phone are set on the user. */
export const ensureUserOnboarded = (email: string) =>
  db
    .updateTable("User")
    .set({ name: E2E_USER_NAME, phone: E2E_USER_PHONE })
    .where("email", "=", email)
    .execute()

export const getE2EUserId = async (email: string) => {
  const user = await db
    .selectFrom("User")
    .where("email", "=", email)
    .select("id")
    .executeTakeFirstOrThrow()
  return user.id
}

/** Reset user onboarding/singpass state before singpass e2e tests. */
export const resetSingpassTestUsers = () =>
  db
    .updateTable("User")
    .set({
      name: "",
      phone: "",
      singpassUuid: null,
    })
    .where((eb) =>
      eb("name", "!=", "")
        .or("phone", "!=", "")
        .or("singpassUuid", "is not", null),
    )
    .execute()

export const setUserSingpassUuid = (email: string, uuid: string) =>
  db
    .updateTable("User")
    .set({ singpassUuid: uuid })
    .where("email", "=", email)
    .execute()

export const insertUserWithoutSites = (email: string) =>
  db
    .insertInto("User")
    .values({
      email,
      id: crypto.randomUUID().toString(),
      name: "",
      phone: "",
    })
    .execute()
