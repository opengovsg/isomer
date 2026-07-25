import { expect } from "@playwright/test"

import { getWhitelistExpiry } from "./whitelist.db"

/** Vendor whitelist row with a future expiry (90-day vendor access). */
export const expectWhitelistedVendorEmail = (email: string) =>
  expect.poll(async () => {
    const expiry = await getWhitelistExpiry(email)
    if (!expiry) return null
    return expiry > new Date()
  })
