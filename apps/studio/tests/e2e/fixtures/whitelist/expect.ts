import { expect } from "@playwright/test"

import { getWhitelistEntry, getWhitelistExpiry } from "./db"

/** Vendor email whitelisted with expiry still in the future. */
export const expectWhitelistedVendorEmail = (email: string) =>
  expect.poll(async () => {
    const expiry = await getWhitelistExpiry(email)
    if (!expiry) return null
    return expiry > new Date()
  })

/** No whitelist row for the email (e.g. rejected bulk submit). */
export const expectWhitelistEntryAbsent = (email: string) =>
  expect.poll(async () => {
    const row = await getWhitelistEntry(email)
    return row === undefined
  })
