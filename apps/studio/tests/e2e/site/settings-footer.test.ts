import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import {
  resetSiteFooter,
  resetSiteFooterColumn1AtMaxItems,
} from "../fixtures/reset"
import { provisionE2ESite } from "../fixtures/site"
import { expectFooterContains } from "../fixtures/site-expect"
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
    await resetSiteFooter(siteId)
  })

  test("admin can edit both footer link columns and publish", async ({
    page,
  }) => {
    const site = new SitePO(page)
    const column1UpdatedLabel = "About E2E"
    const column2NewLabel = "Column 2 E2E Link"

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Act: edit an existing link in column 1
    await site.editFooterLinkLabel("About us", column1UpdatedLabel)

    // Act: add a new link to column 2 (empty by default) — adding just
    // appends a collapsed "No title" row, so it must be opened before its
    // fields are editable
    await site.addFooterLinkButtonForColumn("Footer column 2").click()
    await site.footerLinkButton("No title").click()
    await site.linkLabelField().fill(column2NewLabel)
    await site.setLinkDestinationExternal("example.com/column-two")
    await site.backToFooterButton().click()

    await site.clickPublish()
    await site.expectChangesPublishedToast()

    // Assert
    await expectFooterContains(siteId, column1UpdatedLabel).toBe(true)
    await expectFooterContains(siteId, column2NewLabel).toBe(true)
    await site.reloadSettingsSection("footer")
    await expect(site.footerLinkButton(column1UpdatedLabel)).toBeVisible()
    await expect(site.footerLinkButton(column2NewLabel)).toBeVisible()
  })

  test("admin can add a social media link, and an invalid URL is rejected", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Act: adding a social link with an invalid URL is rejected live —
    // adding just appends a collapsed row (defaulting to "Facebook"), so it
    // must be opened before its fields are editable
    await site.addSocialMediaLinkButton().click()
    await site.footerLinkButton("Facebook").click()
    await site.socialMediaLinkField().fill("not-a-url")
    await expect(
      page.getByText("Link is not in the correct format"),
    ).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()

    // Act: fixing the URL clears the error and allows publishing
    await site.socialMediaLinkField().fill("https://www.facebook.com/isomer")
    await expect(
      page.getByText("Link is not in the correct format"),
    ).not.toBeVisible()
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
    await expect(page.getByText("Contact and feedback form")).toBeVisible()
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
    await expect(page.getByText("Legal pages")).toBeVisible()

    // Act: clear the privacy statement link
    await site.removeLinkButtonByLabel("Privacy statement page").click()

    // Assert
    await expect(
      page.getByText("Privacy statement page cannot be empty"),
    ).toBeVisible()
    await expect(site.publishButton()).toBeDisabled()
  })

  test("cannot add more than 8 links in a footer column", async ({ page }) => {
    const site = new SitePO(page)
    await resetSiteFooterColumn1AtMaxItems(siteId)

    // Arrange
    await site.gotoSettingsSection(siteId, "footer")

    // Assert
    await expect(page.getByText("8/8 links added")).toBeVisible()
    await expect(
      site.addFooterLinkButtonForColumn("Footer column 1"),
    ).toBeDisabled()
  })
})
