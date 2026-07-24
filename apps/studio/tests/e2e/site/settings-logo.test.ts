import { expect, test } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { mockAssetUploadRoutes } from "../fixtures/network"
import { resetSiteLogoSettings } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { expectSiteLogoUrl } from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

const LOGO_FIXTURE = fileURLToPath(
  new URL("../fixtures/e2e-logo.png", import.meta.url),
)
const LOGO_FILENAME = path.basename(LOGO_FIXTURE)

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await mockAssetUploadRoutes(page)
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
    await expect(expectSiteLogoUrl(siteId)).resolves.toMatch(/.+/)
    await site.reloadSettingsSection("logo")
    await expect(site.logoFilenameText(LOGO_FILENAME)).toBeVisible()
  })
})
