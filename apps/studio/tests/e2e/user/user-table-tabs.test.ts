import { expect, test } from "@playwright/test"
import { UsersPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import { ensureUserOnboarded, seedManyEditorsOnSite } from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"

// Plus the site's seeded admin, this puts the table one row past the
// 25-row page size (UserTable.tsx), forcing a second page.
const BULK_EDITOR_COUNT = 25

let siteId: number

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
    await seedManyEditorsOnSite({
      siteId,
      count: BULK_EDITOR_COUNT,
    })
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("Your users and Isomer admins tabs show accurate counts", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act
    await users.goto(siteId)

    // Assert: the site admin plus every bulk-seeded editor on this site
    await users.expectTabCount("Your users", BULK_EDITOR_COUNT + 1)
    // Isomer-admin badge count is run-scoped (other tests may seed admins); tab
    // content is asserted in the Isomer admins tab test below.
    await expect(users.tab("Isomer admins").locator(".badge")).toBeVisible()
  })

  test("Isomer admins tab lists seeded godmode admins without an add-user prompt", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act
    await users.goto(siteId)
    await users.clickIsomerAdminsTab()

    // Assert
    await users.expectIsomerAdminBanner()
    await users.expectUserInTable(TEST_EMAILS.core)
    await users.expectUserInTable(TEST_EMAILS.migrator)
    // Datatable always renders pagination when totalRowCount > 0 (even for
    // a single page of 2). Assert the empty-agency-users CTA is not shown.
    await users.expectAddUsersEmptyPromptHidden()
  })

  test("Your users table starts on page 1 with previous page disabled", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act
    await users.goto(siteId)

    // Assert
    await users.expectCurrentPage(1)
    await users.expectPreviousPageDisabled()
  })

  test("Your users table advances to the last page", async ({ page }) => {
    const users = new UsersPO(page)

    // Arrange
    await users.goto(siteId)

    // Act
    await users.goToNextPage()

    // Assert
    await users.expectCurrentPage(2)
    await users.expectNextPageDisabled()
  })

  test("Your users table returns to page 1 from the last page", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange
    await users.goto(siteId)
    await users.goToNextPage()
    await users.expectCurrentPage(2)

    // Act
    await users.goToPreviousPage()

    // Assert
    await users.expectCurrentPage(1)
  })
})
