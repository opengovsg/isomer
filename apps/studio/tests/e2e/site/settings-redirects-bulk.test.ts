import { expect, test } from "@playwright/test"
import { IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  enableGrowthBookFeature,
  resetGrowthBookPage,
} from "../fixtures/network"
import { resetSiteRedirects } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  expectLiveRedirectCount,
  expectRedirectDestination,
} from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

const VALID_BULK_REDIRECTS_CSV = [
  "When someone visits,Redirect them to",
  "/bulk-one,/dest-one",
  "/bulk-two,/dest-two",
].join("\n")

const BULK_REDIRECT_COUNT = 2

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
    await enableGrowthBookFeature(
      page,
      IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY,
      true,
    )
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteRedirects(siteId)
  })

  test("admin can bulk-upload redirects via CSV", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await resetGrowthBookPage(page)
    await site.gotoSettingsSection(siteId, "redirects")

    // Act
    await site.bulkUploadRedirectsCsv(
      VALID_BULK_REDIRECTS_CSV,
      BULK_REDIRECT_COUNT,
    )

    // Assert
    await expect(expectLiveRedirectCount(siteId)).resolves.toBe(
      BULK_REDIRECT_COUNT,
    )
    await expect(expectRedirectDestination(siteId, "bulk-one")).resolves.toBe(
      "/dest-one",
    )
    await expect(expectRedirectDestination(siteId, "bulk-two")).resolves.toBe(
      "/dest-two",
    )
    await expect(site.redirectPathText("/bulk-one")).toBeVisible()
    await expect(site.redirectPathText("/bulk-two")).toBeVisible()
  })
})
