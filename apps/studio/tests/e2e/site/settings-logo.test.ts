import { expect, test } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  mockAssetUploadRoutes,
  mockFailedAssetUpload,
  mockPresignedPutUrl,
} from "~e2e/fixtures/network"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteLogoSettings } from "~e2e/fixtures/reset"
import {
  expectSiteFaviconUrl,
  expectSiteLogoUrl,
  provisionE2ESite,
} from "~e2e/fixtures/site"
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
  test.describe.configure({ mode: "serial" })

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

  test("admin can upload a favicon and publish", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "logo")
    await expect(site.faviconUploadGroup()).toBeVisible()

    // Act
    await site.uploadFavicon(LOGO_FIXTURE)
    await site.expectLogoFilenameVisible(LOGO_FILENAME)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteFaviconUrl(siteId).toMatch(/.+/)
    await site.reloadSettingsSection("logo")
    await expect(site.logoFilenameText(LOGO_FILENAME)).toBeVisible()
  })

  test("admin can replace a favicon before publishing", async ({ page }) => {
    const site = new SitePO(page)
    const secondFavicon = {
      name: "second-favicon.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-favicon-2"),
    }

    // Arrange
    await site.gotoSettingsSection(siteId, "logo")
    await site.uploadFavicon(LOGO_FIXTURE)
    await site.expectLogoFilenameVisible(LOGO_FILENAME)

    // Act
    await site.removeUploadedFileButton(site.faviconUploadGroup()).click()
    await site.uploadFavicon(secondFavicon)
    await site.expectLogoFilenameVisible(secondFavicon.name)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteFaviconUrl(siteId).toMatch(/.+/)
    await site.reloadSettingsSection("logo")
    await expect(site.logoFilenameText(secondFavicon.name)).toBeVisible()
  })

  test("uploading an unsupported file type is rejected", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "logo")

    // Act
    await site.uploadFavicon({
      name: "not-an-image.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake-pdf"),
    })

    // Assert: the rejected filename is echoed inside the error card itself
    // (expected — it's telling the admin what was rejected), so check that
    // nothing was actually committed instead of asserting the filename is
    // absent from the page entirely.
    await expect(
      site.fileUploadErrorText(site.faviconUploadGroup()),
    ).toBeVisible()
    await expect(
      site.removeUploadedFileButton(site.faviconUploadGroup()),
    ).not.toBeVisible()
  })

  test("uploading an oversized favicon is rejected", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "logo")

    // Act: favicon's max size is 20 kB — 25 kB exceeds it
    await site.uploadFavicon({
      name: "oversized-favicon.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(25_000),
    })

    // Assert: see the unsupported-file-type test above for why we check the
    // "Remove file" button rather than the filename text.
    await expect(
      site.fileUploadErrorText(site.faviconUploadGroup()),
    ).toBeVisible()
    await expect(
      site.removeUploadedFileButton(site.faviconUploadGroup()),
    ).not.toBeVisible()
  })

  test("a failed upload does not commit a logo", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await mockFailedAssetUpload(page)
    await site.gotoSettingsSection(siteId, "logo")

    // Act
    await site.uploadLogo(LOGO_FIXTURE)

    // Assert: the dropzone never commits the file, so the form stays clean
    await expect(site.logoFilenameText(LOGO_FILENAME)).not.toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
    await expectSiteLogoUrl(siteId).toBe("")
  })
})
