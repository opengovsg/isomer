import { expect } from "@playwright/test"
import { db } from "~/server/modules/database"

/** Vendor whitelist row with a future expiry (90-day vendor access). */
export const expectWhitelistedVendorEmail = (email: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Whitelist")
      .where("email", "=", email.toLowerCase())
      .select("expiry")
      .executeTakeFirst()
    if (!row?.expiry) return null
    return row.expiry > new Date()
  })
