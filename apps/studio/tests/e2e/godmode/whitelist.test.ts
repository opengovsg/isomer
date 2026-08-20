import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { GodmodePO } from "~e2e/fixtures/po"
import { ensureUserOnboarded, uniqueVendorEmail } from "~e2e/fixtures/user"
import {
  deleteWhitelistedVendorEmails,
  expectWhitelistedVendorEmail,
  getWhitelistEntry,
} from "~e2e/fixtures/whitelist"

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
