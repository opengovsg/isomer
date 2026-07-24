import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteTheme } from "../fixtures/reset"
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
    await resetSiteTheme(siteId)
  })

  test("admin can change the primary colour and publish", async ({ page }) => {
    const site = new SitePO(page)
    await site.gotoSettingsSection(siteId, "colours")

    const colourInput = page.getByLabel("Main brand colour")
    await colourInput.clear()
    await colourInput.fill("ff0000")
    await expect(site.publishButton()).toBeEnabled()
    await site.clickPublish()
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(colourInput).toHaveValue("ff0000")
  })
})
