import { expect } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

const E2E_USER_NAME = "test-e2e"
const E2E_USER_PHONE = "82345678"

export const uniqueInviteeEmail = () =>
  `e2e-invitee-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

export const deleteUsersByEmailPattern = async (emailPattern: string) => {
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

export const expectUserRoleOnSite = (siteId: number, email: string) =>
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
