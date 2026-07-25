import { test } from "@playwright/test"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"
import {
  deleteWhitelistedVendorEmails,
  ensureUserOnboarded,
  uniqueVendorEmail,
} from "../fixtures/user"
import { expectWhitelistedVendorEmail } from "../fixtures/whitelist.db"

let vendorEmails: string[] = []

test.describe("migrator", { tag: roleTag("migrator") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.migrator)
    vendorEmails = [uniqueVendorEmail(), uniqueVendorEmail()]
  })

  test.afterEach(async () => {
    await deleteWhitelistedVendorEmails(...vendorEmails)
  })

  test("migrator can bulk-whitelist vendor emails", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Arrange
    await godmode.gotoWhitelist()

    // Act
    await godmode.fillVendorEmails(vendorEmails)
    await godmode.clickWhitelistSubmit()

    // Assert
    await godmode.expectWhitelistSuccessToast(0, vendorEmails.length)
    for (const email of vendorEmails) {
      await expectWhitelistedVendorEmail(email).toBe(true)
    }
  })
})
