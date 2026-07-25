import { db } from "~/server/modules/database"

export const getE2EUserId = async (email: string) => {
  const user = await db
    .selectFrom("User")
    .where("email", "=", email)
    .select("id")
    .executeTakeFirstOrThrow()
  return user.id
}

export const getUserRoleOnSite = async (siteId: number, email: string) => {
  const row = await db
    .selectFrom("User as u")
    .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
    .where("u.email", "=", email)
    .where("rp.siteId", "=", siteId)
    .where("rp.deletedAt", "is", null)
    .select(["rp.role"])
    .executeTakeFirst()
  return row?.role ?? null
}

/** Active sitewide permission row, if any. */
export const getActiveUserPermissionOnSite = async (
  siteId: number,
  email: string,
) => {
  const row = await db
    .selectFrom("User as u")
    .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
    .where("u.email", "=", email)
    .where("rp.siteId", "=", siteId)
    .where("rp.deletedAt", "is", null)
    .select(["rp.id"])
    .executeTakeFirst()
  return row ?? null
}
