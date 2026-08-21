import { expect } from "@playwright/test"

import { getWhitelistEntry } from "./whitelist.db"

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
