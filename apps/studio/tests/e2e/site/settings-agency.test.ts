import { expect, test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteAgencySettings } from "~e2e/fixtures/reset"
import { provisionE2ESite, expectSiteName } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin],
  })
  siteId = site.siteId
  siteName = site.siteName
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteAgencySettings(siteId, siteName)
  })

  test("admin can update site name on the agency settings page", async ({
    page,
  }) => {
    const renamedSiteName = `E2E Site ${siteId} Renamed`
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await expect(site.siteNameField()).toBeVisible()

    // Act
    await site.fillSiteName(renamedSiteName)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteName(siteId).toBe(renamedSiteName)
    await site.reloadSettingsSection("agency")
    await expect(site.siteNameField()).toHaveValue(renamedSiteName)
  })

  test("whitespace-only site name is rejected", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")

    // Act
    await site.fillSiteName("   ")

    // Assert
    await expect(site.siteNameEmptyValidationError()).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
    await expectSiteName(siteId).toBe(siteName)
  })

  test("agency owner field is read-only", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange / Act
    await site.gotoSettingsSection(siteId, "agency")

    // Assert
    await expect(site.agencyOwnerField()).toBeVisible()
    await expect(site.agencyOwnerField()).toBeDisabled()
  })
})
