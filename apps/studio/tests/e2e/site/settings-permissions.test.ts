import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import type { SettingsSection } from "../fixtures/site.po"
import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

/** Settings sections that render a Publish CTA (redirects publish inline instead). */
const PUBLISH_GATED_SECTIONS: SettingsSection[] = [
  "agency",
  "colours",
  "footer",
  "integrations",
  "logo",
  "navbar",
  "notification",
]

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Publisher, RoleType.Editor],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
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
    for (const section of PUBLISH_GATED_SECTIONS) {
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

    // Arrange
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
    for (const section of PUBLISH_GATED_SECTIONS) {
      await site.gotoSettingsSection(siteId, section)
      await expect(site.publishButton()).not.toBeVisible()
    }
  })
})
