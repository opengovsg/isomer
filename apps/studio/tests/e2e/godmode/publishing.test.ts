import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"
import {
  clearSiteCodeBuildId,
  provisionE2ESite,
  setSiteCodeBuildId,
} from "../fixtures/site"
import { expectSitePublishAuditLog } from "../fixtures/site-expect"
import { ensureUserOnboarded } from "../fixtures/user"

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

    // Act — clear CodeBuild id after the page loads so publishSite skips AWS
    await clearSiteCodeBuildId(siteId)
    await godmode.clickPublishForSite(siteId)

    // Assert
    await godmode.expectSitePublishedToast()
    await expectSitePublishAuditLog(siteId).toBe(true)
  })
})
