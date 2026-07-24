import { expect, test } from "@playwright/test"
import { IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { enableGrowthBookFeature } from "../fixtures/network"
import { resetSiteRedirects } from "../fixtures/reset"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

const VALID_BULK_REDIRECTS_CSV = [
  "When someone visits,Redirect them to",
  "/bulk-one,/dest-one",
  "/bulk-two,/dest-two",
].join("\n")

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Admin] })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeEach(async ({ page }) => {
    await enableGrowthBookFeature(
      page,
      IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY,
      true,
    )
    await ensureUserOnboarded(TEST_EMAILS.admin)
    await resetSiteRedirects(siteId)
  })

  test("admin can bulk-upload redirects via CSV", async ({ page }) => {
    // Drop the in-memory GrowthBook singleton so the mocked features fetch runs
    // on the next app load (see fixtures/network.ts).
    await page.goto("about:blank")
    await page.goto(`/sites/${siteId}/settings/redirects`)
    await page.waitForURL(/\/settings\/redirects$/)

    await page
      .getByRole("button", { name: /bulk upload with a \.csv/i })
      .click()
    await expect(page.getByText("Bulk upload redirects")).toBeVisible()

    await page.locator("[role='dialog'] input[type='file']").setInputFiles({
      name: "redirects.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(VALID_BULK_REDIRECTS_CSV),
    })

    await page.getByRole("button", { name: "Process redirects" }).click()
    await expect(
      page.getByText("All 2 redirects are good to go."),
    ).toBeVisible()

    await page.getByRole("button", { name: "Publish 2 redirects" }).click()
    await expect(page.getByText("2 redirects published")).toBeVisible()

    await expect(page.getByText("/bulk-one")).toBeVisible()
    await expect(page.getByText("/bulk-two")).toBeVisible()
  })
})
