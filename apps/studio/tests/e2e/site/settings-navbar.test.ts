import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteNavbar } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { expectNavbarContains } from "../fixtures/site-expect"
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
    await resetSiteNavbar(siteId)
  })

  test("admin can edit a navbar item label", async ({ page }) => {
    const site = new SitePO(page)
    const updatedLabel = "E2E Nav Item"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")

    // Act
    await site.editNavbarItemLabel("Expandable nav item", updatedLabel)
    await site.clickPublish({ force: true })
    await site.expectChangesPublishedToast()

    // Assert
    await expect(expectNavbarContains(siteId, updatedLabel)).resolves.toBe(true)
    await site.reloadSettingsSection("navbar")
    await expect(site.navbarItemText(updatedLabel)).toBeVisible()
  })
})
