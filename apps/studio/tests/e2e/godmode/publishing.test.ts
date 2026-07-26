import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { GodmodePO } from "~e2e/fixtures/po"
import {
  clearSiteCodeBuildId,
  expectSitePublishAuditLog,
  provisionE2ESite,
  setSiteCodeBuildId,
} from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
    await setSiteCodeBuildId(siteId, `e2e-codebuild-${siteId}`)
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("core admin can publish a site from godmode", async ({ page }) => {
    const godmode = new GodmodePO(page)

    // Arrange
    await godmode.gotoPublishing()
    await godmode.expectPublishButtonVisibleForSite(siteId)

    // Act — clear CodeBuild id after the button renders so publishSite skips AWS
    await clearSiteCodeBuildId(siteId)
    await godmode.clickPublishForSite(siteId)

    // Assert
    await godmode.expectSitePublishedToast()
    await expectSitePublishAuditLog(siteId).toBe(true)
  })
})
