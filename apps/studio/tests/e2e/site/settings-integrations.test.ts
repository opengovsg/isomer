import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteIntegrations } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { expectSiteGtmId } from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
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
    await expect(expectSiteGtmId(siteId)).resolves.toBe("GTM-TESTE2E01")
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
    await expect(expectSiteGtmId(siteId)).resolves.toBeNull()
  })
})
