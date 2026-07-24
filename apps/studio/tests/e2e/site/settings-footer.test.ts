import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteFooter } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { expectFooterContains } from "../fixtures/site-expect"
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
    await resetSiteFooter(siteId)
  })

  test("admin can edit a footer link label", async ({ page }) => {
    const site = new SitePO(page)
    const updatedLabel = "About E2E"

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Act
    await site.editFooterLinkLabel("About us", updatedLabel)
    await site.clickPublish({ force: true })
    await site.expectChangesPublishedToast()

    // Assert
    await expect(expectFooterContains(siteId, updatedLabel)).resolves.toBe(true)
    await site.reloadSettingsSection("footer")
    await expect(site.footerLinkButton(updatedLabel)).toBeVisible()
  })
})
