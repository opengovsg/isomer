import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { mockTrpcMutationError } from "~e2e/fixtures/network"
import { DashboardPO, GodmodePO } from "~e2e/fixtures/po"
import { getResourceByTitle } from "~e2e/fixtures/resource/db"
import { expectSiteName } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("core admin can create a site", async ({ page }) => {
    const siteName = `E2E Godmode Site ${crypto.randomUUID().slice(0, 8)}`
    const godmode = new GodmodePO(page)
    const dashboard = new DashboardPO(page)

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

    const home = await getResourceByTitle({ siteId, title: "Home" })
    expect(home?.type).toBe("RootPage")
    expect(home?.state).toBe("Published")

    const search = await getResourceByTitle({ siteId, title: "Search" })
    expect(search?.type).toBe("Page")
    expect(search?.state).toBe("Published")

    await dashboard.expectCreateButtonVisible()
    await dashboard.expectHomepageRowVisible()
  })

  test("core admin can retry after a failed site creation", async ({
    page,
  }) => {
    const siteName = `E2E Godmode Retry ${crypto.randomUUID().slice(0, 8)}`
    const godmode = new GodmodePO(page)

    // Arrange
    await mockTrpcMutationError(page, "site.create", {
      message: "Site creation is temporarily unavailable",
      times: 1,
    })
    await godmode.gotoCreateSite()
    await godmode.fillSiteName(siteName)

    // Act
    await godmode.clickCreateSite()

    // Assert
    await godmode.expectCreateSiteFailedToast()
    await expect(godmode.siteNameInput()).toHaveValue(siteName)

    // Act — retry hits the real mutation
    await godmode.clickCreateSite()

    // Assert
    await godmode.expectSiteCreatedToast(siteName)
    const siteId = await godmode.expectRedirectToCreatedSite()
    expect(siteId).toBeGreaterThan(0)
    await expectSiteName(siteId).toBe(siteName)
  })
})
