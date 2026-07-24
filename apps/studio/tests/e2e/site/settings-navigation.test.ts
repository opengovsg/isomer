import type { Locator } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import type { SettingsSection } from "../fixtures/site.po"
import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

const SETTINGS_SECTIONS: SettingsSection[] = [
  "agency",
  "colours",
  "footer",
  "integrations",
  "logo",
  "navbar",
  "notification",
  "redirects",
]

const SECTION_VISIBLE_ELEMENT: Record<
  SettingsSection,
  (site: SitePO) => Locator
> = {
  agency: (site) => site.siteNameField(),
  colours: (site) => site.mainBrandColourField(),
  footer: (site) => site.footerLinkButton("About us"),
  integrations: (site) => site.gtmIdField(),
  logo: (site) => site.logoUploadInput(),
  navbar: (site) => site.navbarItemText("Expandable nav item"),
  notification: (site) => site.notificationBannerToggle(),
  redirects: (site) => site.redirectSourceField(),
}

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
  })

  test("admin can navigate settings sections via the side nav", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "agency")
    await expect(SECTION_VISIBLE_ELEMENT.agency(site)).toBeVisible()

    for (const section of SETTINGS_SECTIONS) {
      if (section === "agency") continue

      // Act
      await site.openSettingsSection(section)

      // Assert
      await expect(SECTION_VISIBLE_ELEMENT[section](site)).toBeVisible()
    }
  })
})
