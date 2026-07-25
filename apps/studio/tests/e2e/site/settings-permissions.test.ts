import { expect, test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
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

  test("publisher does not see Publish on settings sections that use it", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange / Act / Assert
    for (const section of PUBLISH_GATED_SETTINGS_SECTIONS) {
      await site.gotoSettingsSection(siteId, section)
      await expect(site.publishButton()).not.toBeVisible()
    }
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can view agency settings but not publish", async ({ page }) => {
    const site = new SitePO(page)

    // Act
    await site.gotoSettingsSection(siteId, "agency")

    // Assert
    await expect(site.siteNameField()).toBeVisible()
    await expect(site.publishButton()).not.toBeVisible()
  })

  test("editor does not see Publish on settings sections that use it", async ({
    page,
  }) => {
    const site = new SitePO(page)

    // Arrange / Act / Assert
    for (const section of PUBLISH_GATED_SETTINGS_SECTIONS) {
      await site.gotoSettingsSection(siteId, section)
      await expect(site.publishButton()).not.toBeVisible()
    }
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor can view agency settings but not publish", async ({ page }) => {
    const site = new SitePO(page)

    // Act
    await site.gotoSettingsSection(siteId, "agency")

    // Assert
    await expect(site.siteNameField()).toBeVisible()
    await expect(site.publishButton()).not.toBeVisible()
  })

  test("editor does not see Publish on settings sections that use it", async ({
    page,
  }) => {
    const site = new SitePO(page)

    for (const section of PUBLISH_GATED_SECTIONS) {
      await site.gotoSettingsSection(siteId, section)
      await expect(site.publishButton()).not.toBeVisible()
    }
  })
})
