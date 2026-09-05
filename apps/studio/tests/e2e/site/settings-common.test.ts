import { expect, test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  mockSiteUpdateConfigFailure,
  unmockSiteUpdateConfigFailure,
} from "~e2e/fixtures/network"
import { PUBLISH_GATED_SETTINGS_SECTIONS, SitePO } from "~e2e/fixtures/po"
import {
  resetSiteAgencySettings,
  resetSiteFooter,
  resetSiteIntegrations,
  resetSiteLogoSettings,
  resetSiteNavbar,
  resetSiteNotification,
  resetSiteTheme,
} from "~e2e/fixtures/reset"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { expectSiteName } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const RESET_BY_SECTION: Record<
  (typeof PUBLISH_GATED_SETTINGS_SECTIONS)[number],
  (siteId: number) => Promise<unknown>
> = {
  agency: (id) => resetSiteAgencySettings(id),
  colours: resetSiteTheme,
  footer: resetSiteFooter,
  integrations: resetSiteIntegrations,
  logo: resetSiteLogoSettings,
  navbar: resetSiteNavbar,
  notification: resetSiteNotification,
}

let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
  siteName = site.siteName
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.describe.configure({ mode: "serial" })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  for (const section of PUBLISH_GATED_SETTINGS_SECTIONS) {
    test(`clean ${section} settings form keeps Publish disabled`, async ({
      page,
    }) => {
      const site = new SitePO(page)

      // Arrange
      await RESET_BY_SECTION[section](siteId)
      await site.gotoSettingsSection(siteId, section)

      // Assert
      await expect(site.publishButton()).toBeVisible()
      await expect(site.publishButton()).toBeDisabled()
    })
  }

  test("unsaved navigation can stay on the current page", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await site.fillSiteName(`${siteName} unsaved edit`)

    // Act
    await site.clickSettingsSidebarSection("colours")
    await expect(site.unsavedChangesModalHeading()).toBeVisible()
    await site.goBackToEditingButton().click()

    // Assert
    await site.waitForSettingsSection("agency")
    await expect(site.siteNameField()).toHaveValue(`${siteName} unsaved edit`)
  })

  test("unsaved navigation can discard changes", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await site.fillSiteName(`${siteName} unsaved edit`)

    // Act
    await site.clickSettingsSidebarSection("colours")
    await expect(site.unsavedChangesModalHeading()).toBeVisible()
    await site.yesLeaveThisPageButton().click()

    // Assert
    await site.waitForSettingsSection("colours")
    await expectSiteName(siteId).toBe(siteName)
  })

  test("failed save keeps form values", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)
    const renamedSiteName = `${siteName} retry`

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await site.fillSiteName(renamedSiteName)
    await mockSiteUpdateConfigFailure(page)

    // Act
    await site.clickPublish()

    // Assert
    await expect(site.siteUpdateFailureText()).toBeVisible()
    await expect(site.siteNameField()).toHaveValue(renamedSiteName)
    await expectSiteName(siteId).toBe(siteName)
  })

  test("admin can publish after a transient save failure", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteAgencySettings(siteId, siteName)
    const renamedSiteName = `${siteName} retry`

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await site.fillSiteName(renamedSiteName)
    await mockSiteUpdateConfigFailure(page)
    await site.clickPublish()
    await expect(site.siteUpdateFailureText()).toBeVisible()
    await unmockSiteUpdateConfigFailure(page)

    // Act
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

    // Assert: the form reflects the edit immediately...
    await expect(site.siteNameField()).toHaveValue(editedSiteName)
    // ...while the persisted value is untouched until Publish is clicked.
    await expectSiteName(siteId).toBe(siteName)

    await site.reloadSettingsSection("agency")
    await expect(site.siteNameField()).toHaveValue(siteName)
  })
})
