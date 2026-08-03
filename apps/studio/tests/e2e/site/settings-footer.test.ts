import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteFooter } from "~e2e/fixtures/reset"
import { expectFooterContains, provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteFooter(siteId)
  })

  test("admin can edit a footer link label", async ({ page }) => {
    const site = new SitePO(page)
    const updatedLabel = "About E2E"

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Act
    await site.editFooterLinkLabel("About us", updatedLabel)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectFooterContains(siteId, updatedLabel).toBe(true)
    await site.reloadSettingsSection("footer")
    await expect(site.footerLinkButton(updatedLabel)).toBeVisible()
  })
})
