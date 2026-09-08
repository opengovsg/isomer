import { db } from "~/server/modules/database"

export const getUserRoleOnSite = (opts: { siteId: number; email: string }) =>
  db
    .selectFrom("User as u")
    .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
    .where("u.email", "=", opts.email)
    .where("rp.siteId", "=", opts.siteId)
    .where("rp.deletedAt", "is", null)
    .select(["rp.role"])
    .executeTakeFirst()

/** Active sitewide permission row id, or undefined when absent. */
export const getActiveSitePermissionId = (opts: {
  siteId: number
  email: string
}) =>
  db
    .selectFrom("User as u")
    .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
    .where("u.email", "=", opts.email)
    .where("rp.siteId", "=", opts.siteId)
    .where("rp.deletedAt", "is", null)
    .select(["rp.id"])
    .executeTakeFirst()
