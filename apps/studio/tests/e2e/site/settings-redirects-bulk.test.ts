import { expect, test } from "@playwright/test"
import { IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import {
  enableGrowthBookFeature,
  resetGrowthBookPage,
} from "~e2e/fixtures/network"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteRedirects } from "~e2e/fixtures/reset"
import {
  expectLiveRedirectCount,
  expectRedirectDestination,
  provisionE2ESite,
} from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

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
    await expectLiveRedirectCount(siteId).toBe(BULK_REDIRECT_COUNT)
    await expectRedirectDestination(siteId, "bulk-one").toBe("/dest-one")
    await expectRedirectDestination(siteId, "bulk-two").toBe("/dest-two")
    await expect(site.redirectPathText("/bulk-one")).toBeVisible()
    await expect(site.redirectPathText("/bulk-two")).toBeVisible()
  })
})
