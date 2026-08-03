import { expect, test } from "@playwright/test"
import crypto from "crypto"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"
import { expectSiteName } from "../fixtures/site-expect"
import { ensureUserOnboarded } from "../fixtures/user"

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
