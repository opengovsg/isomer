import { expect, test } from "@playwright/test"
import crypto from "crypto"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { PageEditorPO } from "../fixtures/page-editor.po"
import { seedRootPage } from "../fixtures/page-seed"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
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
  })

  test("admin can search for a page and open it in the editor", async ({
    page,
  }) => {
    const pageTitle = `Search Target ${crypto.randomUUID().slice(0, 8)}`
    await seedRootPage({ siteId, pageTitle })

    const dashboard = new DashboardPO(page)
    await dashboard.gotoSite(siteId)
    await dashboard.searchFor(pageTitle)
    await expect(
      page.getByRole("link").filter({ hasText: pageTitle }),
    ).toBeVisible({ timeout: 10_000 })
    await dashboard.clickSearchResult(pageTitle)

    const editor = new PageEditorPO(page)
    await editor.expectLoaded()
  })
})
