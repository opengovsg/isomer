import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { DashboardPO } from "../fixtures/dashboard.po"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
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
