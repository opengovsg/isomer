import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteIntegrations } from "~e2e/fixtures/reset"
import {
  expectSiteAskgovId,
  expectSiteGtmId,
  expectSiteVicaId,
  provisionE2ESite,
} from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

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
    await expect(site.gtmIdValidationError()).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
    await expectSiteGtmId(siteId).toBeNull()
  })

  test("admin can configure AskGov", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")

    // Act
    await site.configureAskgov("e2e-agency")

    // Assert
    await expectSiteAskgovId(siteId).toBe("e2e-agency")
  })

  test("admin can remove AskGov", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")
    await site.configureAskgov("e2e-agency")

    // Act
    await site.reloadSettingsSection("integrations")
    await site.removeAskgov()

    // Assert
    await expectSiteAskgovId(siteId).toBeNull()
  })

  test("admin can configure VICA", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")

    // Act
    await site.configureVica("e2e-vica-app")

    // Assert
    await expectSiteVicaId(siteId).toBe("e2e-vica-app")
  })

  test("admin can remove VICA", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "integrations")
    await site.configureVica("e2e-vica-app")

    // Act
    await site.reloadSettingsSection("integrations")
    await site.removeVica()

    // Assert
    await expectSiteVicaId(siteId).toBeNull()
  })
})
