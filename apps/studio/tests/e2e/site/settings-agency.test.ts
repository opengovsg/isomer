import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteAgencySettings } from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import { expectSiteName } from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

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
    await expect(
      page.getByText("Site name cannot be empty or contain only spaces"),
    ).toBeVisible()
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
