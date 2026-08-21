import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { mockTrpcMutationError } from "../fixtures/network"
import {
  resetSiteAgencySettings,
  resetSiteFooter,
  resetSiteNavbar,
  resetSiteTheme,
} from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import { SiteAdminPO } from "../fixtures/site-admin.po"
import {
  expectFooterContains,
  expectNavbarContains,
  expectSiteConfigSiteName,
  expectSiteThemeBrandColour,
} from "../fixtures/site-expect"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number
let siteName: string

const parseJsonField = async (
  admin: SiteAdminPO,
  field: "config" | "theme" | "navbar" | "footer",
) =>
  JSON.parse(await admin.jsonField(field).inputValue()) as Record<
    string,
    unknown
  >

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin],
  })
  siteId = site.siteId
  siteName = site.siteName
})

test.describe("core", { tag: roleTag("core") }, () => {
  test.describe.configure({ mode: "serial" })
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.core)
    await resetSiteAgencySettings(siteId, siteName)
    await resetSiteTheme(siteId)
    await resetSiteNavbar(siteId)
    await resetSiteFooter(siteId)
  })

  test("core admin can save valid config, theme, navbar, and footer JSON", async ({
    page,
  }) => {
    const admin = new SiteAdminPO(page)
    const updatedSiteName = `Admin JSON ${crypto.randomUUID().slice(0, 8)}`
    const brandColour = "#123456"
    const navbarLabel = `Admin nav ${crypto.randomUUID().slice(0, 8)}`
    const footerLabel = `Admin footer ${crypto.randomUUID().slice(0, 8)}`

    // Arrange
    await admin.goto(siteId)
    await expect(admin.saveButton()).toBeDisabled()

    const config = (await parseJsonField(admin, "config")) as {
      siteName?: string
    }
    const theme = (await parseJsonField(admin, "theme")) as {
      colors?: { brand?: { canvas?: { inverse?: string } } }
    }
    const navbar = (await parseJsonField(admin, "navbar")) as {
      items?: { name?: string }[]
    }
    const footer = (await parseJsonField(admin, "footer")) as {
      siteNavItems?: { title?: string }[]
    }

    config.siteName = updatedSiteName
    if (theme.colors?.brand?.canvas) {
      theme.colors.brand.canvas.inverse = brandColour
    }
    if (navbar.items?.[0]) {
      navbar.items[0].name = navbarLabel
    }
    if (footer.siteNavItems?.[0]) {
      footer.siteNavItems[0].title = footerLabel
    }

    // Act
    await admin.fillJsonField("config", JSON.stringify(config, null, 2))
    await admin.fillJsonField("theme", JSON.stringify(theme, null, 2))
    await admin.fillJsonField("navbar", JSON.stringify(navbar, null, 2))
    await admin.fillJsonField("footer", JSON.stringify(footer, null, 2))
    await expect(admin.saveButton()).toBeEnabled()
    await admin.clickSave()

    // Assert
    await admin.expectSavedToast()
    await expect(admin.saveButton()).toBeDisabled()
    await expectSiteConfigSiteName(siteId).toBe(updatedSiteName)
    await expectSiteThemeBrandColour(siteId).toBe(brandColour)
    await expectNavbarContains(siteId, navbarLabel).toBe(true)
    await expectFooterContains(siteId, footerLabel).toBe(true)

    await admin.reload()
    await expect(admin.jsonField("config")).toHaveValue(
      new RegExp(updatedSiteName),
    )
    await expect(admin.jsonField("theme")).toHaveValue(new RegExp(brandColour))
    await expect(admin.jsonField("navbar")).toHaveValue(new RegExp(navbarLabel))
    await expect(admin.jsonField("footer")).toHaveValue(new RegExp(footerLabel))
  })

  test("missing JSON prevents saving", async ({ page }) => {
    const admin = new SiteAdminPO(page)

    // Arrange
    await admin.goto(siteId)

    // Act
    await admin.fillJsonField("navbar", "")
    await admin.clickSave()

    // Assert
    await admin.expectFieldError("Site navbar must be present")
    await expectNavbarContains(siteId, "Expandable nav item").toBe(true)
  })

  test("unsaved navigation prompts before leaving", async ({ page }) => {
    const admin = new SiteAdminPO(page)
    const navbarLabel = `Unsaved nav ${crypto.randomUUID().slice(0, 8)}`

    // Arrange
    await admin.goto(siteId)
    const navbar = (await parseJsonField(admin, "navbar")) as {
      items?: { name?: string }[]
    }
    if (navbar.items?.[0]) {
      navbar.items[0].name = navbarLabel
    }
    await admin.fillJsonField("navbar", JSON.stringify(navbar, null, 2))
    await expect(admin.saveButton()).toBeEnabled()

    // Act
    await admin.clickSiteContentNav()

    // Assert
    await admin.expectUnsavedChangesModal()
    await admin.clickGoBackToEditing()
    await expect(admin.jsonField("navbar")).toHaveValue(new RegExp(navbarLabel))
  })

  test("retry after save failure works", async ({ page }) => {
    const admin = new SiteAdminPO(page)
    const navbarLabel = `Retry nav ${crypto.randomUUID().slice(0, 8)}`

    // Arrange
    await admin.goto(siteId)
    const navbar = (await parseJsonField(admin, "navbar")) as {
      items?: { name?: string }[]
    }
    if (navbar.items?.[0]) {
      navbar.items[0].name = navbarLabel
    }
    await admin.fillJsonField("navbar", JSON.stringify(navbar, null, 2))
    await mockTrpcMutationError(page, "site.setSiteConfigByAdmin", {
      message: "Failed to persist site config",
      times: 1,
    })

    // Act
    await admin.clickSave()

    // Assert
    await admin.expectSaveErrorToast()
    await expect(admin.saveButton()).toBeEnabled()

    // Act — retry hits the real mutation
    await admin.clickSave()

    // Assert
    await admin.expectSavedToast()
    await expectNavbarContains(siteId, navbarLabel).toBe(true)
  })

  test("leaving with unsaved changes discards edits", async ({ page }) => {
    const admin = new SiteAdminPO(page)
    const dashboard = new DashboardPO(page)
    const savedLabel = `Saved nav ${crypto.randomUUID().slice(0, 8)}`

    // Arrange
    await admin.goto(siteId)
    const navbar = (await parseJsonField(admin, "navbar")) as {
      items?: { name?: string }[]
    }
    if (navbar.items?.[0]) {
      navbar.items[0].name = savedLabel
    }
    await admin.fillJsonField("navbar", JSON.stringify(navbar, null, 2))
    await admin.clickSave()
    await admin.expectSavedToast()

    // Act
    await admin.fillJsonField(
      "navbar",
      JSON.stringify(
        { items: [{ name: "discarded", url: "/discarded" }] },
        null,
        2,
      ),
    )
    await expect(admin.saveButton()).toBeEnabled()
    await admin.clickSiteContentNav()
    await admin.expectUnsavedChangesModal()
    await admin.clickLeavePage()

    // Assert
    await dashboard.expectHomepageRowVisible()
    await expectNavbarContains(siteId, savedLabel).toBe(true)
  })
})
