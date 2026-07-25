import { db } from "~/server/modules/database"

export const getWhitelistExpiry = async (email: string) => {
  const row = await db
    .selectFrom("Whitelist")
    .where("email", "=", email.toLowerCase())
    .select("expiry")
    .executeTakeFirst()
  return row?.expiry ?? null
}
