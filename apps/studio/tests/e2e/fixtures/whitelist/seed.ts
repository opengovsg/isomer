import { db } from "~/server/modules/database"

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
