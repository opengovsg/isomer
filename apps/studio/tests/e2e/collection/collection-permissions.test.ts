import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { DashboardPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor does not see the Create new button on the site dashboard", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)

    // Arrange / Act / Assert
    await dashboard.gotoSite(siteId)
    await dashboard.expectCreateMenuHidden()
  })
})

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher does not see the Create new button on the site dashboard", async ({
    page,
  }) => {
    const dashboard = new DashboardPO(page)

    // Arrange / Act / Assert
    await dashboard.gotoSite(siteId)
    await dashboard.expectCreateMenuHidden()
  })
})
