import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteNavbar } from "../fixtures/reset"
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
    await resetSiteNavbar(siteId)
  })

  test("admin can edit a navbar item label", async ({ page }) => {
    const site = new SitePO(page)
    await page.goto(`/sites/${siteId}/settings/navbar`)
    await page.waitForURL(/\/settings\/navbar$/)

    await page.getByText("Expandable nav item", { exact: true }).click()
    await page.getByLabel("Menu item label").fill("E2E Nav Item")

    await site.publishButton().click({ force: true })
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(page.getByText("E2E Nav Item", { exact: true })).toBeVisible()
  })
})
