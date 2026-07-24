import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteFooter } from "../fixtures/reset"
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
    await resetSiteFooter(siteId)
  })

  test("admin can edit a footer link label", async ({ page }) => {
    const site = new SitePO(page)
    await site.gotoSettingsSection(siteId, "footer")

    await page.getByRole("button", { name: "About us" }).click()
    await page.getByLabel("Link label").fill("About E2E")

    await site.clickPublish({ force: true })
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(page.getByRole("button", { name: "About E2E" })).toBeVisible()
  })
})
