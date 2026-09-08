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

export const deleteUsersByEmailLike = async (emailPattern: string) => {
  const users = await db
    .selectFrom("User")
    .where("email", "like", emailPattern)
    .select("id")
    .execute()
  if (users.length === 0) return

  const ids = users.map((user) => user.id)
  await db.deleteFrom("ResourcePermission").where("userId", "in", ids).execute()
  await db.deleteFrom("User").where("id", "in", ids).execute()
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

export const deleteWhitelistByEmailLike = (emailPattern: string) =>
  db.deleteFrom("Whitelist").where("email", "like", emailPattern).execute()
