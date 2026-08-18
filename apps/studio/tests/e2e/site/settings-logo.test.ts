import { expect, test } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { mockAssetUploadRoutes, mockPresignedPutUrl } from "../fixtures/network"
import { resetSiteLogoSettings } from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import {
  expectSiteFaviconUrl,
  expectSiteLogoUrl,
} from "../fixtures/site-expect"
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

  test("admin can upload and then replace a favicon, publish, and reload", async ({
    page,
  }) => {
    const site = new SitePO(page)
    const secondFavicon = {
      name: "second-favicon.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-favicon-2"),
    }

    // Arrange
    await site.gotoSettingsSection(siteId, "logo")
    await expect(site.faviconUploadGroup()).toBeVisible()

    // Act: upload
    await site.uploadFavicon(LOGO_FIXTURE)
    await site.expectLogoFilenameVisible(LOGO_FILENAME)

    // Act: replace — remove, then upload a different file
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

    // Assert
    await expect(site.fileUploadErrorText()).toBeVisible()
    await expect(site.logoFilenameText("not-an-image.pdf")).not.toBeVisible()
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

    // Assert
    await expect(page.getByText(/exceeds the size limit/)).toBeVisible()
    await expect(
      site.logoFilenameText("oversized-favicon.png"),
    ).not.toBeVisible()
  })

  test("a failed upload does not commit a logo", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange: force the S3 PUT to fail after the presigned URL is minted
    await page.route(
      (url) => url.hostname === "user-content.example.com",
      (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Upload failed" }),
        }),
    )
    await site.gotoSettingsSection(siteId, "logo")

    // Act
    await site.uploadLogo(LOGO_FIXTURE)

    // Assert: the dropzone never commits the file, so the form stays clean
    await expect(site.logoFilenameText(LOGO_FILENAME)).not.toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
    await expectSiteLogoUrl(siteId).toBe("")
  })
})
