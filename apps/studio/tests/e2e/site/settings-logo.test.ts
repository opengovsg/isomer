import { expect, test } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  mockAssetUploadRoutes,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteLogoSettings } from "~e2e/fixtures/reset"
import { expectSiteLogoUrl, provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const LOGO_FIXTURE = fileURLToPath(
  new URL("../fixtures/e2e-logo.png", import.meta.url),
)
const LOGO_FILENAME = path.basename(LOGO_FIXTURE)

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await mockAssetUploadRoutes(page)
    await mockPresignedPutUrl(page)
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteLogoSettings(siteId)
  })

  test("admin can upload a logo and publish", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "logo")

    // Act
    await site.uploadLogo(LOGO_FIXTURE)
    await site.expectLogoFilenameVisible(LOGO_FILENAME)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteLogoUrl(siteId).toMatch(/.+/)
    await site.reloadSettingsSection("logo")
    await expect(site.logoFilenameText(LOGO_FILENAME)).toBeVisible()
  })
})
