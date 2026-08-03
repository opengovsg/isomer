import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { GodmodePO } from "~e2e/fixtures/po"
import { expectSiteName } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("core admin can create a site", async ({ page }) => {
    const siteName = `E2E Godmode Site ${crypto.randomUUID().slice(0, 8)}`
    const godmode = new GodmodePO(page)

    // Arrange
    await godmode.gotoCreateSite()

    // Act
    await godmode.fillSiteName(siteName)
    await godmode.clickCreateSite()

    // Assert
    await godmode.expectSiteCreatedToast(siteName)
    const siteId = await godmode.expectRedirectToCreatedSite()
    expect(siteId).toBeGreaterThan(0)
    await expectSiteName(siteId).toBe(siteName)
  })
})
