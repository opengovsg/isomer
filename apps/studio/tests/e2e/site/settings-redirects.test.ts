import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { resetSiteRedirects } from "../fixtures/reset"
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
    await resetSiteRedirects(siteId)
  })

  test("admin can create and delete a redirect", async ({ page }) => {
    const source = `e2e-${crypto.randomUUID().slice(0, 8)}`
    const destination = "/new-destination"
    const site = new SitePO(page)

    await page.goto(`/sites/${siteId}/settings/redirects`)
    await page.waitForURL(/\/settings\/redirects$/)

    await page.getByPlaceholder("redirect-from").fill(source)
    await page
      .getByPlaceholder("/path-to-page or https://www.google.com")
      .fill(destination)
    await page.getByRole("button", { name: "Add" }).click()
    await site.expectChangesPublishedToast()
    await expect(page.getByText(`/${source}`)).toBeVisible()

    await page
      .getByRole("button", { name: `Delete redirect for /${source}` })
      .click()
    await page.getByRole("button", { name: "Delete redirect" }).click()
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(
      page.getByRole("button", { name: `Delete redirect for /${source}` }),
    ).not.toBeVisible()
  })
})
