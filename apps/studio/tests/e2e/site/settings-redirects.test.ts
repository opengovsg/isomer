import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteRedirects } from "~e2e/fixtures/reset"
import {
  expectLiveRedirectCount,
  expectRedirectDeleted,
  expectRedirectDestination,
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
    await resetSiteRedirects(siteId)
  })

  test("admin can create a redirect", async ({ page }) => {
    const source = `e2e-${crypto.randomUUID().slice(0, 8)}`
    const destination = "/new-destination"
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "redirects")

    // Act
    await site.addRedirect(source, destination)
    await site.expectChangesPublishedToast()

    // Assert
    await expectRedirectDestination(siteId, source).toBe(destination)
    await expect(site.redirectPathText(`/${source}`)).toBeVisible()
  })

  test("admin can delete a redirect", async ({ page }) => {
    const source = `e2e-${crypto.randomUUID().slice(0, 8)}`
    const destination = "/new-destination"
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "redirects")
    await site.addRedirect(source, destination)
    await site.expectChangesPublishedToast()

    // Act
    await site.deleteRedirect(source)
    await site.expectChangesPublishedToast()

    // Assert
    await expectRedirectDeleted(siteId, source).toBe(true)
    await site.reloadSettingsSection("redirects")
    await expect(site.deleteRedirectButton(source)).not.toBeVisible()
  })

  test("admin can cancel deleting a redirect", async ({ page }) => {
    const source = `e2e-${crypto.randomUUID().slice(0, 8)}`
    const destination = "/kept-destination"
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "redirects")
    await site.addRedirect(source, destination)
    await site.expectChangesPublishedToast()

    // Act
    await site.cancelDeleteRedirect(source)

    // Assert
    await expectRedirectDestination(siteId, source).toBe(destination)
    await expectLiveRedirectCount(siteId).toBe(1)
    await expect(site.redirectPathText(`/${source}`)).toBeVisible()
  })
})
