import type { Locator } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import {
  ALL_SETTINGS_SECTIONS,
  SitePO,
  type SettingsSection,
} from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const SECTION_VISIBLE_ELEMENT: Record<
  SettingsSection,
  (site: SitePO) => Locator
> = {
  agency: (site) => site.siteNameField(),
  colours: (site) => site.mainBrandColourField(),
  footer: (site) => site.footerLinkButton("About us"),
  integrations: (site) => site.gtmIdField(),
  logo: (site) => site.logoUploadGroup(),
  navbar: (site) => site.navbarItemText("Expandable nav item"),
  notification: (site) => site.notificationBannerToggle(),
  redirects: (site) => site.redirectSourceField(),
}

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  for (const section of ALL_SETTINGS_SECTIONS) {
    test(`admin can open ${section} settings via the side nav`, async ({
      page,
    }) => {
      const site = new SitePO(page)

      if (section === "agency") {
        // Arrange / Act
        await site.gotoSettingsSection(siteId, section)
      } else {
        // Arrange
        await site.gotoSettingsSection(siteId, "agency")

        // Act
        await site.openSettingsSection(section)
      }

      // Assert
      await expect(SECTION_VISIBLE_ELEMENT[section](site)).toBeVisible()
    })
  }
})
