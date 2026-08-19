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
  test("admin can add a navbar link, delete it, and publish both changes", async ({
    page,
  }) => {
    const site = new SitePO(page)
    const newLinkLabel = "New E2E Link"

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")

    // Act: add a new link
    await site.addNavbarLinkButton().click()
    await site.navbarItemText("Navbar item").click()
    await page.getByLabel("Menu item label").fill(newLinkLabel)
    await site.setLinkDestinationExternal("example.com")
    await site.backToNavigationBarButton().click()

    // Assert: new link shows up, and can be published
    await expect(site.navbarItemText(newLinkLabel)).toBeVisible()
    await site.clickPublish()
    await site.expectChangesPublishedToast()
    await expectNavbarContains(siteId, newLinkLabel).toBe(true)

    // Act: delete the link we just published
    await site.navbarItemText(newLinkLabel).click()
    await site.deleteThisLinkButton().click()
    await site.confirmDeleteLinkButton().click()

    // Assert: deletion is only local until Publish is clicked again
    await expect(site.navbarItemText(newLinkLabel)).not.toBeVisible()
    await site.clickPublish()
    await site.expectChangesPublishedToast()
    await expectNavbarContains(siteId, newLinkLabel).toBe(false)
  })

  test("admin can edit and delete an existing sub-item", async ({ page }) => {
    const site = new SitePO(page)
    const updatedSubItemLabel = "E2E Sub Item"

    // Arrange: expand "Expandable nav item" to reveal its seeded sub-items
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarExpandItemButton("items.0").click()
    await expect(site.navbarItemText("PA's network one")).toBeVisible()

    // Act: edit a sub-item
    await site.navbarItemText("PA's network one").click()
    await page.getByLabel("Menu item label").fill(updatedSubItemLabel)
    await site.backToNavigationBarButton().click()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, updatedSubItemLabel).toBe(true)

    // Act: delete the sub-item we just edited
    await site.navbarExpandItemButton("items.0").click()
    await site.navbarItemText(updatedSubItemLabel).click()
    await site.deleteThisLinkButton().click()
    await site.confirmDeleteLinkButton().click()
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
    await page.getByLabel("Menu item label").fill("")

    // Assert
    await expect(
      page.getByText("Menu item label cannot be empty"),
    ).toBeVisible()
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

  test("admin can configure a Call-to-Action with mobile pinning, and utility links, then publish", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "navbar")
    await site.navbarCustomiseTab().click()

    // Act: configure the primary Call-to-Action
    await site.ctaToggle().click()
    await site.ctaButtonTextField().fill("Apply now")
    await site.setLinkDestinationExternal("example.com/apply")
    await site.ctaPinOnMobileToggle().click()

    // Act: configure a utility link
    await site.utilityLinksToggle().click()
    await site.addUtilityItemButton().click()
    await site.utilityItemRow(1).click()
    await site.utilityItemNameField().fill("Login")
    await site.setLinkDestinationExternal("example.com/login")
    await site.nestedDrawerBackButton().click()

    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectNavbarContains(siteId, "Apply now").toBe(true)
    await expectNavbarContains(siteId, "isPinnedOnMobile").toBe(true)
    await expectNavbarContains(siteId, "Login").toBe(true)
  })
})
