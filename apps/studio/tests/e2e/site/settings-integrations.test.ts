import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteIntegrations } from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import {
  expectSiteAskgovId,
  expectSiteGtmId,
  expectSiteVicaId,
} from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteIntegrations(siteId)
  })

  test("admin can save a GTM ID on integrations settings", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")

    // Act
    await site.fillGtmId("GTM-TESTE2E01")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteGtmId(siteId).toBe("GTM-TESTE2E01")
    await site.reloadSettingsSection("integrations")
    await expect(site.gtmIdField()).toHaveValue("GTM-TESTE2E01")
  })

  test("admin unpublished GTM ID change is discarded on reload", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")
    await site.fillGtmId("GTM-TESTE2E01")

    // Act
    await site.reloadSettingsSection("integrations")

    // Assert
    await expect(site.gtmIdField()).toHaveValue("")
    await expectSiteGtmId(siteId).toBeNull()
  })

  test("invalid GTM ID prevents publishing", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")

    // Act
    await site.fillGtmId("not-a-valid-gtm-id")

    // Assert
    await expect(
      page.getByText(
        "Google Tag Manager (GTM) ID is not in the correct format",
      ),
    ).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
    await expectSiteGtmId(siteId).toBeNull()
  })

  test("admin can configure and remove AskGov", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")

    // Act: enable and configure
    await site.askgovToggle().click()
    await site.askgovIdField().fill("e2e-agency")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteAskgovId(siteId).toBe("e2e-agency")

    // Act: remove
    await site.reloadSettingsSection("integrations")
    await site.askgovToggle().click()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteAskgovId(siteId).toBeNull()
  })

  test("admin can configure and remove VICA", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")

    // Act: enable and configure
    await site.vicaToggle().click()
    await site.vicaIdField().fill("e2e-vica-app")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteVicaId(siteId).toBe("e2e-vica-app")

    // Act: remove
    await site.reloadSettingsSection("integrations")
    await site.vicaToggle().click()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteVicaId(siteId).toBeNull()
  })
})
