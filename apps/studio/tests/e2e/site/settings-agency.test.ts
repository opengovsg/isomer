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
    roles: [RoleType.Admin, RoleType.Publisher],
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
    await site.gotoSettings(siteId, "agency")

    const nameField = page.getByLabel("Site name")
    await expect(nameField).toBeVisible()
    await nameField.fill(renamedSiteName)

    await site.publishButton().click()
    await site.expectChangesPublishedToast()

    await page.reload()
    await expect(page.getByLabel("Site name")).toHaveValue(renamedSiteName)
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Publish button on agency settings", async ({
    page,
  }) => {
    await new SitePO(page).gotoSettings(siteId, "agency")

    await expect(page.getByLabel("Site name")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Publish" }),
    ).not.toBeVisible()
  })
})
