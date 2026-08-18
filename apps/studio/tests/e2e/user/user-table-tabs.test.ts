import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmail,
  ensureUserOnboarded,
  seedManyEditorsOnSite,
} from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

// Plus the site's seeded admin, this puts the table one row past the
// 25-row page size (UserTable.tsx), forcing a second page.
const BULK_EDITOR_COUNT = 25

let siteId: number
let bulkEmails: string[]

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId
    bulkEmails = await seedManyEditorsOnSite({
      siteId,
      count: BULK_EDITOR_COUNT,
    })
  })

  test.afterAll(async () => {
    await deleteUsersByEmail(...bulkEmails)
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

    // Assert: the site admin plus every bulk-seeded editor
    await users.expectTabCount("Your users", BULK_EDITOR_COUNT + 1)
    await users.expectTabCount("Isomer admins", 0)
  })

  test("Isomer admins tab shows an empty state with no add-user prompt", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act / Assert
    await users.goto(siteId)
    await users.expectIsomerAdminsEmptyState()
  })

  test("Your users table paginates once there are more than 25 users", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act
    await users.goto(siteId)

    // Assert: page 1 of 2
    await users.expectCurrentPage(1)
    await users.expectPreviousPageDisabled()

    // Act: advance to the last page
    await users.goToNextPage()

    // Assert: page 2 of 2
    await users.expectCurrentPage(2)
    await users.expectNextPageDisabled()

    // Act: go back
    await users.goToPreviousPage()

    // Assert
    await users.expectCurrentPage(1)
  })
})
