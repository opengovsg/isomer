import { expect } from "@playwright/test"
import { db } from "~/server/modules/database"

export const getWhitelistEntry = (email: string) =>
  db
    .selectFrom("Whitelist")
    .where("email", "=", email.toLowerCase())
    .selectAll()
    .executeTakeFirst()

/** Vendor whitelist row with a future expiry (90-day vendor access). */
export const expectWhitelistedVendorEmail = (email: string) =>
  expect.poll(async () => {
    const row = await getWhitelistEntry(email)
    if (!row?.expiry) return null
    return row.expiry > new Date()
  })

/** Admin whitelist row with no expiry. */
export const expectWhitelistedAdminEmail = (email: string) =>
  expect.poll(async () => {
    const row = await getWhitelistEntry(email)
    if (!row) return null
    return row.expiry === null
  })
