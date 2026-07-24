import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteIntegrations } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { SitePO } from "../fixtures/site.po"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteIntegrations(siteId)
  })

  test("admin can save a GTM ID on integrations settings", async ({ page }) => {
    const site = new SitePO(page)
    await site.gotoSettingsSection(siteId, "integrations")

    const gtmField = page.getByLabel("Google Tag Manager (GTM) ID")
    await gtmField.fill("GTM-TESTE2E01")

    await site.clickPublish()
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(gtmField).toHaveValue("GTM-TESTE2E01")
  })
})
