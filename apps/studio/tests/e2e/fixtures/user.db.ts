import { db } from "~/server/modules/database"

export const getGrantedRole = (opts: { siteId: number; email: string }) =>
  db
    .selectFrom("User as u")
    .innerJoin("ResourcePermission as rp", "rp.userId", "u.id")
    .where("u.email", "=", opts.email)
    .where("rp.siteId", "=", opts.siteId)
    .where("rp.deletedAt", "is", null)
    .select(["rp.role"])
    .executeTakeFirst()
