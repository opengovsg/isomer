import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"
import { PUBLISH_GATED_SETTINGS_SECTIONS, SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

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

    // Arrange / Act
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
