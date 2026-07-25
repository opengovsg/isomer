import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteNavbar } from "~e2e/fixtures/reset"
import { expectNavbarContains, provisionE2ESite } from "~e2e/fixtures/site"
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
    await resetSiteNavbar(siteId)
  })

  test("admin can edit a navbar item label", async ({ page }) => {
    const site = new SitePO(page)
    const updatedLabel = "E2E Nav Item"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")

    // Act
    await site.editNavbarItemLabel("Expandable nav item", updatedLabel)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, updatedLabel).toBe(true)
    await site.reloadSettingsSection("navbar")
    await expect(site.navbarItemText(updatedLabel)).toBeVisible()
  })
})
