import { expect } from "@playwright/test"

import { getWhitelistExpiry } from "./db"

/** Vendor email whitelisted with expiry still in the future. */
export const expectWhitelistedVendorEmail = (email: string) =>
  expect.poll(async () => {
    const expiry = await getWhitelistExpiry(email)
    if (!expiry) return null
    return expiry > new Date()
  })
