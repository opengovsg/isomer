import { expect } from "@playwright/test"

import { getWhitelistEntry, getWhitelistExpiry } from "./db"

/** Vendor email whitelisted with expiry still in the future. */
export const expectWhitelistedVendorEmail = (email: string) =>
  expect.poll(async () => {
    const expiry = await getWhitelistExpiry(email)
    if (!expiry) return null
    return expiry > new Date()
  })

/** Admin whitelist row with no expiry. */
export const expectWhitelistedAdminEmail = (email: string) =>
  expect.poll(async () => {
    const row = await getWhitelistEntry(email)
    if (!row) return null
    return row.expiry === null
  })
