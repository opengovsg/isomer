import { db } from "~/server/modules/database"

export const getWhitelistEntry = (email: string) =>
  db
    .selectFrom("Whitelist")
    .where("email", "=", email.toLowerCase())
    .selectAll()
    .executeTakeFirst()

export const getWhitelistExpiry = async (email: string) => {
  const row = await getWhitelistEntry(email)
  return row?.expiry ?? null
}
