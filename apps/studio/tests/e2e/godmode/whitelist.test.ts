import { expect, test } from "@playwright/test"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"
import {
  deleteWhitelistedVendorEmails,
  ensureUserOnboarded,
  uniqueVendorEmail,
} from "../fixtures/user"
import { expectWhitelistedVendorEmail } from "../fixtures/whitelist-expect"
import { getWhitelistEntry } from "../fixtures/whitelist.db"

test.describe("migrator", { tag: roleTag("migrator") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.migrator)
  })

  test("migrator can bulk-whitelist vendor emails", async ({ page }) => {
    const godmode = new GodmodePO(page)
    const vendorEmails = [uniqueVendorEmail(), uniqueVendorEmail()]

    try {
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
    } finally {
      await deleteWhitelistedVendorEmails(...vendorEmails)
    }
  })

  test("invalid whitelist input is rejected without losing valid entries", async ({
    page,
  }) => {
    const godmode = new GodmodePO(page)
    const validEmail = uniqueVendorEmail()
    const pastedEmails = [validEmail, "not-an-email"]

    try {
      // Arrange
      await godmode.gotoWhitelist()

      // Act
      await godmode.fillVendorEmails(pastedEmails)
      await godmode.clickWhitelistSubmit()

      // Assert
      await godmode.expectWhitelistErrorToast()
      await expect(godmode.vendorEmailsTextarea()).toHaveValue(
        pastedEmails.join("\n"),
      )
      expect(await getWhitelistEntry(validEmail)).toBeUndefined()
    } finally {
      await deleteWhitelistedVendorEmails(validEmail)
    }
  })
})
