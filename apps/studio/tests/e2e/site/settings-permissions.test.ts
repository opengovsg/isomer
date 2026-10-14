import { expect, test } from "@playwright/test"
import { TEST_EMAILS, roleTag } from "~e2e/fixtures/auth"
import { PUBLISH_GATED_SETTINGS_SECTIONS, SitePO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor],
  })
  siteId = site.siteId
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  for (const section of PUBLISH_GATED_SETTINGS_SECTIONS) {
    test(`publisher does not see Publish on ${section} settings`, async ({
      page,
    }) => {
      const site = new SitePO(page)

      // Arrange / Act
      await site.gotoSettingsSection(siteId, section)

      // Assert
      await site.expectSettingsSectionLoaded(section)
      await expect(site.publishButton()).not.toBeVisible()
    })
  }
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can view agency settings but not publish", async ({ page }) => {
    const site = new SitePO(page)

    // Arrange / Act
    await site.gotoSettingsSection(siteId, "agency")

    // Assert
    await expect(site.siteNameField()).toBeVisible()
    await expect(site.publishButton()).not.toBeVisible()
  })

  for (const section of PUBLISH_GATED_SETTINGS_SECTIONS) {
    test(`editor does not see Publish on ${section} settings`, async ({
      page,
    }) => {
      const site = new SitePO(page)

      // Arrange / Act
      await site.gotoSettingsSection(siteId, section)

      // Assert
      await site.expectSettingsSectionLoaded(section)
      await expect(site.publishButton()).not.toBeVisible()
    })
  }
})
