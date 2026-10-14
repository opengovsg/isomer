import { expect, test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import { resetSiteTheme } from "~e2e/fixtures/reset"
import {
  provisionE2ESite,
  expectSiteThemeBrandColour,
} from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

const DEFAULT_BRAND_COLOUR = "#00405f"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteTheme(siteId)
  })

  test("admin can change the primary colour and publish", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "colours")

    // Act
    await site.setMainBrandColour("ff0000")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    // "ff0000" fails the app's WCAG contrast check (see
    // src/features/settings/utils.ts passesContrastCheck), so the palette
    // generator substitutes the closest passing shade instead of storing the
    // raw input verbatim.
    await expectSiteThemeBrandColour(siteId).toBe("#b30000")
    await site.reloadSettingsSection("colours")
    await expect(site.mainBrandColourField()).toHaveValue("b30000")
  })

  test("admin sees the colour swatch preview update immediately, before publishing", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "colours")
    await expect(site.mainBrandColourSwatch()).toHaveCSS(
      "background-color",
      "rgb(0, 64, 95)", // #00405f, the default brand colour
    )

    // Act
    await site.setMainBrandColour("336699")

    // Assert: the swatch reflects the unsaved edit immediately
    await expect(site.mainBrandColourSwatch()).toHaveCSS(
      "background-color",
      "rgb(51, 102, 153)", // #336699
    )
    // ...while nothing is persisted until Publish
    await expectSiteThemeBrandColour(siteId).toBe(DEFAULT_BRAND_COLOUR)
  })

  test("admin unpublished colour change is discarded on reload", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "colours")
    await site.setMainBrandColour("ff0000")

    // Act
    await site.reloadSettingsSection("colours")

    // Assert
    await expect(site.mainBrandColourField()).toHaveValue("00405f")
    await expectSiteThemeBrandColour(siteId).toBe(DEFAULT_BRAND_COLOUR)
  })
})
