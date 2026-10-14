import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { mockGodmodeSitePublish } from "~e2e/fixtures/network"
import { GodmodePO } from "~e2e/fixtures/po"
import {
  clearSiteCodeBuildId,
  e2eCodeBuildIdForSite,
  expectSitePublishAuditLog,
  provisionE2ESite,
  setSiteCodeBuildId,
} from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number
let unconfiguredSiteId: number
let unconfiguredSiteName: string
let retryableSiteId: number

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
    await setSiteCodeBuildId(siteId, e2eCodeBuildIdForSite(siteId))

    const unconfigured = await provisionE2ESite({ roles: [RoleType.Admin] })
    unconfiguredSiteId = unconfigured.siteId
    unconfiguredSiteName = unconfigured.siteName

    const retryable = await provisionE2ESite({ roles: [RoleType.Admin] })
    retryableSiteId = retryable.siteId
    await setSiteCodeBuildId(
      retryableSiteId,
      e2eCodeBuildIdForSite(retryableSiteId),
    )
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("core admin can publish a site from godmode", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Arrange — gotoPublishing waits for listAllSites to include this site.
    await godmode.gotoPublishing(siteId)

    // Act — clear CodeBuild id after the button renders so publishSite skips AWS
    await clearSiteCodeBuildId(siteId)
    await godmode.clickPublishForSite(siteId)

    // Assert
    await godmode.expectSitePublishedToast()
    await expectSitePublishAuditLog(siteId).toBe(true)
  })

  test("core admin cannot publish a site without a CodeBuild ID", async ({
    page,
  }) => {
    const godmode = new GodmodePO(page)

    // Arrange
    await godmode.gotoPublishing()

    // Assert
    await godmode.expectSiteListed({
      siteId: unconfiguredSiteId,
      siteName: unconfiguredSiteName,
      codeBuildId: "-",
    })
    await godmode.expectPublishButtonHidden(unconfiguredSiteId)
  })

  test("core admin can retry after a failed godmode publish", async ({
    page,
  }) => {
    const godmode = new GodmodePO(page)
    const errorMessage = "CodeBuild unavailable"

    // Arrange
    await mockGodmodeSitePublish(page, { failTimes: 1, errorMessage })
    await godmode.gotoPublishing(retryableSiteId)

    // Act
    await godmode.clickPublishForSite(retryableSiteId)

    // Assert
    await godmode.expectPublishFailedToast(errorMessage)

    // Act
    await godmode.clickPublishForSite(retryableSiteId)

    // Assert
    await godmode.expectSitePublishedToast()
  })
})
