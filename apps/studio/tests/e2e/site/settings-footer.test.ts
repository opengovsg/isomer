import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { SitePO } from "~e2e/fixtures/po"
import {
  resetSiteFooter,
  resetSiteFooterColumn1AtMaxItems,
} from "~e2e/fixtures/reset"
import { expectFooterContains, provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
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
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectFooterContains(siteId, updatedLabel).toBe(true)
    await site.reloadSettingsSection("footer")
    await expect(site.footerLinkButton(updatedLabel)).toBeVisible()
  })

  test("admin can add a footer link to column 2 and publish", async ({
    page,
  }) => {
    const site = new SitePO(page)
    const column2NewLabel = "Column 2 E2E Link"

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Act
    await site.addFooterLinkToColumn(
      "Footer column 2",
      column2NewLabel,
      "example.com/column-two",
    )
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectFooterContains(siteId, column2NewLabel).toBe(true)
    await site.reloadSettingsSection("footer")
    await expect(site.footerLinkButton(column2NewLabel)).toBeVisible()
  })

  test("invalid social media URL is rejected", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Act
    await site.addSocialMediaLinkButton().click()
    await site.socialMediaLinkField().fill("not-a-url")

    // Assert
    await expect(site.invalidLinkFormatError()).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
  })

  test("admin can add a valid social media link and publish", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")
    await site.addSocialMediaLinkButton().click()

    // Act
    await site.socialMediaLinkField().fill("https://www.facebook.com/isomer")
    await site.backToFooterButton().click()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectFooterContains(siteId, "https://www.facebook.com/isomer").toBe(
      true,
    )
  })

  test("admin can reconfigure the contact us link", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange: the default fixture already sets a contact us link, so it
    // must be cleared before a new one can be set (BaseLinkControl only
    // exposes "Link something..." when the field is empty).
    await site.gotoSettingsSection(siteId, "footer")
    await expect(site.contactAndFeedbackHeading()).toBeVisible()
    await site.removeLinkButtonByLabel("Contact us page").click()

    // Act
    await site.setLinkDestinationExternal("example.com/contact")
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectFooterContains(siteId, "example.com/contact").toBe(true)
  })

  test("privacy statement and terms of use links are required", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange: both fields are pre-populated by the default fixture data
    await site.gotoSettingsSection(siteId, "footer")
    await expect(site.legalPagesHeading()).toBeVisible()

    // Act
    await site.removeLinkButtonByLabel("Privacy statement page").click()

    // Assert
    await expect(site.privacyStatementEmptyError()).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
  })

  test("cannot add more than 8 links in a footer column", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteFooterColumn1AtMaxItems(siteId)

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Assert
    await expect(site.footerLinksCountText("8/8")).toBeVisible()
    await expect(
      site.addFooterLinkButtonForColumn("Footer column 1"),
    ).toBeDisabled()
  })
})
