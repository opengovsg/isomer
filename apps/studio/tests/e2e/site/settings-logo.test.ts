import { expect, test } from "@playwright/test"
import path from "path"
import { fileURLToPath } from "url"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { mockAssetUploadRoutes } from "../fixtures/network"
import { resetSiteLogoSettings } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

const LOGO_FIXTURE = fileURLToPath(
  new URL("../fixtures/e2e-logo.png", import.meta.url),
)

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
    await page.goto(`/sites/${siteId}/settings/logo`)
    await page.waitForURL(/\/settings\/logo$/)

    await page
      .getByRole("group")
      .filter({ hasText: /^Logo/ })
      .getByTestId("file-upload")
      .setInputFiles(LOGO_FIXTURE)
    await expect(page.getByText(path.basename(LOGO_FIXTURE))).toBeVisible({
      timeout: 15_000,
    })

    await site.publishButton().click()
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(page.getByText(path.basename(LOGO_FIXTURE))).toBeVisible()
  })
})
