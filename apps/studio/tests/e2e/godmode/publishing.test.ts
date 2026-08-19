import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"
import { mockGodmodeSitePublish } from "../fixtures/network"
import { provisionE2ESite, setSiteCodeBuildId } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let publishableSiteId: number
let publishableSiteName: string
let publishableCodeBuildId: string
let unconfiguredSiteId: number
let unconfiguredSiteName: string

test.describe("core", { tag: roleTag("core") }, () => {
  test.beforeAll(async () => {
    const publishable = await provisionE2ESite({ roles: [RoleType.Admin] })
    publishableSiteId = publishable.siteId
    publishableSiteName = publishable.siteName
    publishableCodeBuildId = `e2e-codebuild-${publishableSiteId}`
    await setSiteCodeBuildId(publishableSiteId, publishableCodeBuildId)

    const unconfigured = await provisionE2ESite({ roles: [RoleType.Admin] })
    unconfiguredSiteId = unconfigured.siteId
    unconfiguredSiteName = unconfigured.siteName
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
  })

  test("core admin can list and publish a configured site from godmode", async ({
    page,
  }) => {
    const godmode = new GodmodePO(page)

    // Arrange
    await mockGodmodeSitePublish(page)
    await godmode.gotoPublishing()

    // Assert
    await godmode.expectSiteListed({
      siteId: publishableSiteId,
      siteName: publishableSiteName,
      codeBuildId: publishableCodeBuildId,
    })
    await godmode.expectPublishButtonVisible(publishableSiteId)

    // Act
    await godmode.clickPublishForSite(publishableSiteId)

    // Assert — CodeBuild is async; UI toast only
    await godmode.expectSitePublishedToast()
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
    await mockGodmodeSitePublish(page, {
      failTimes: 1,
      errorMessage,
    })
    await godmode.gotoPublishing()

    // Act
    await godmode.clickPublishForSite(publishableSiteId)

    // Assert
    await godmode.expectPublishFailedToast(errorMessage)

    // Act
    await godmode.clickPublishForSite(publishableSiteId)

    // Assert
    await godmode.expectSitePublishedToast()
  })
})
