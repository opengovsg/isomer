import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteNavbar, resetSiteNavbarAtMaxItems } from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import { expectNavbarContains } from "../fixtures/site-expect"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

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

  // NOTE: drag-and-drop reordering (and nesting an item as a sub-item, which
  // is also done by dragging one item onto another) is intentionally not
  // covered here. It's built on Atlaskit's native HTML5 Drag and Drop API
  // with custom pointer-based hitbox math, which isn't reliably driveable
  // via Playwright's synthetic events. The pure reducer logic is exhaustively
  // unit-tested in JsonFormsNavbarControl/__tests__/utils.test.ts instead.
  test("admin can add a navbar link and publish", async ({ page }) => {
    const site = new SitePO(page)
    const newLinkLabel = "New E2E Link"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")

    // Act
    await site.addNavbarLink(newLinkLabel, "example.com")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expect(site.navbarItemText(newLinkLabel)).toBeVisible()
    await expectNavbarContains(siteId, newLinkLabel).toBe(true)
  })

  test("admin can delete a published navbar link", async ({ page }) => {
    const site = new SitePO(page)
    const newLinkLabel = "New E2E Link"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.addNavbarLink(newLinkLabel, "example.com")
    await site.clickPublish()
    await site.expectChangesPublishedToast()
    await expectNavbarContains(siteId, newLinkLabel).toBe(true)

    // Act
    await site.deleteNavbarLink(newLinkLabel)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, newLinkLabel).toBe(false)
  })

  test("admin can edit an existing sub-item", async ({ page }) => {
    const site = new SitePO(page)
    const updatedSubItemLabel = "E2E Sub Item"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarExpandItemButton("items.0").click()
    await expect(site.navbarItemText("PA's network one")).toBeVisible()

    // Act
    await site.editNavbarItemLabel("PA's network one", updatedSubItemLabel)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, updatedSubItemLabel).toBe(true)
  })

  test("admin can delete an existing sub-item", async ({ page }) => {
    const site = new SitePO(page)
    const updatedSubItemLabel = "E2E Sub Item"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarExpandItemButton("items.0").click()
    await site.editNavbarItemLabel("PA's network one", updatedSubItemLabel)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Act
    await site.navbarExpandItemButton("items.0").click()
    await site.deleteNavbarLink(updatedSubItemLabel)
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, updatedSubItemLabel).toBe(false)
  })

  test("empty menu item label is rejected", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarItemText("Expandable nav item").click()

    // Act
    await site.fillNavbarMenuItemLabel("")

    // Assert
    await expect(site.navbarMenuItemLabelEmptyError()).toBeVisible()
    await site.backToNavigationBarButton().click()
    await expect(site.publishButton()).toBeDisabled()
  })

  test("cannot add more than 8 top-level links", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteNavbarAtMaxItems(siteId)

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")

    // Assert
    await expect(site.navbarLinksCountText()).toHaveText("8/8 links added")
    await expect(site.addNavbarLinkButton()).toBeDisabled()
  })

  test("admin can configure Call-to-Action with mobile pinning and publish", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarCustomiseTab().click()

    // Act
    await site.ctaToggle().click()
    await site.ctaButtonTextField().fill("Apply now")
    await site.setLinkDestinationExternal("example.com/apply")
    await site.ctaPinOnMobileToggle().click()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, "Apply now").toBe(true)
    await expectNavbarContains(siteId, "isPinnedOnMobile").toBe(true)
  })

  test("admin can configure utility links and publish", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarCustomiseTab().click()

    // Act
    await site.utilityLinksToggle().click()
    await site.addUtilityItemButton().click()
    await site.utilityItemRow(1).click()
    await site.utilityItemNameField().fill("Login")
    await site.setLinkDestinationExternal("example.com/login")
    await site.nestedDrawerBackButton().click()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, "Login").toBe(true)
  })
})
