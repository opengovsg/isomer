import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteAgencySettings } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin],
  })
  siteId = site.siteId
  siteName = site.siteName
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteAgencySettings(siteId, siteName)
  })

  test("admin can update site name on the agency settings page", async ({
    page,
  }) => {
    const renamedSiteName = `E2E Site ${siteId} Renamed`
    const site = new SitePO(page)
    await site.gotoSettingsSection(siteId, "agency")

    await expect(site.siteNameField()).toBeVisible()
    await site.fillSiteName(renamedSiteName)

    await site.clickPublish()
    await site.expectChangesPublishedToast()

    await site.reloadSettingsSection("agency")
    await expect(site.siteNameField()).toHaveValue(renamedSiteName)
  })
})
