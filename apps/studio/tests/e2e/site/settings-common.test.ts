import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import type { SettingsSection } from "../fixtures/site.po"
import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  resetSiteAgencySettings,
  resetSiteFooter,
  resetSiteIntegrations,
  resetSiteLogoSettings,
  resetSiteNavbar,
  resetSiteNotification,
  resetSiteTheme,
} from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import { expectSiteName } from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

/** Settings sections that render a Publish CTA (redirects publish inline instead). */
const PUBLISH_GATED_SECTIONS: {
  section: SettingsSection
  reset: (siteId: number) => Promise<unknown>
}[] = [
  { section: "agency", reset: (id) => resetSiteAgencySettings(id) },
  { section: "colours", reset: resetSiteTheme },
  { section: "footer", reset: resetSiteFooter },
  { section: "integrations", reset: resetSiteIntegrations },
  { section: "logo", reset: resetSiteLogoSettings },
  { section: "navbar", reset: resetSiteNavbar },
  { section: "notification", reset: resetSiteNotification },
]

let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  siteName = site.siteName
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("clean settings forms keep Publish disabled", async ({ page }) => {
    const site = new SitePO(page)

    for (const { section, reset } of PUBLISH_GATED_SECTIONS) {
      await reset(siteId)
      await site.gotoSettingsSection(siteId, section)
      await expect(site.publishButton()).toBeVisible()
      await expect(site.publishButton()).toBeDisabled()
    }
  })

  test("unsaved navigation supports both stay and discard", async ({
    page,
  }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await site.fillSiteName(`${siteName} unsaved edit`)

    // Act: navigate away, then choose to stay
    await page.getByRole("link", { name: "Colours" }).click()
    await expect(site.unsavedChangesModalHeading()).toBeVisible()
    await site.goBackToEditingButton().click()

    // Assert: still on agency page, edit intact
    await expect(page).toHaveURL(/\/settings\/agency$/)
    await expect(site.siteNameField()).toHaveValue(`${siteName} unsaved edit`)

    // Act: navigate away again, this time discard
    await page.getByRole("link", { name: "Colours" }).click()
    await expect(site.unsavedChangesModalHeading()).toBeVisible()
    await site.yesLeaveThisPageButton().click()

    // Assert: navigated away, and the unpublished edit never persisted
    await expect(page).toHaveURL(/\/settings\/colours$/)
    await expectSiteName(siteId).toBe(siteName)
  })

  test("failed save keeps form values and allows retry", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)
    const renamedSiteName = `${siteName} retry`

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await site.fillSiteName(renamedSiteName)

    // Act: first publish attempt fails
    await page.route("**/api/trpc/site.updateSiteConfig*", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            json: {
              message: "Internal server error",
              code: -32603,
              data: { httpStatus: 500 },
            },
          },
        }),
      }),
    )
    await site.clickPublish()
    await expect(page.getByText("Failed to update site")).toBeVisible()

    // Assert: value is retained and DB is unchanged
    await expect(site.siteNameField()).toHaveValue(renamedSiteName)
    await expectSiteName(siteId).toBe(siteName)

    // Act: retry succeeds once the failure is no longer forced
    await page.unroute("**/api/trpc/site.updateSiteConfig*")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectSiteName(siteId).toBe(renamedSiteName)
  })

  test("preview reflects unsaved edits immediately, persisted state only changes after Publish", async ({
    page,
  }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)
    const editedSiteName = `${siteName} preview`

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")

    // Act
    await site.fillSiteName(editedSiteName)

    // Assert: the form (and its live preview) reflects the edit immediately...
    await expect(site.siteNameField()).toHaveValue(editedSiteName)
    // ...while the persisted value is untouched until Publish is clicked.
    await expectSiteName(siteId).toBe(siteName)

    await site.reloadSettingsSection("agency")
    await expect(site.siteNameField()).toHaveValue(siteName)
  })
})
