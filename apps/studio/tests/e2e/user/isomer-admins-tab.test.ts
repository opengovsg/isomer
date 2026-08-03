import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { UsersPO } from "~e2e/fixtures/po"
import { provisionE2ESite } from "~e2e/fixtures/site"
import {
  deleteUsersByEmail,
  ensureUserOnboarded,
  seedIsomerAdminOnSite,
} from "~e2e/fixtures/user"
import { RoleType } from "~prisma/generated/generatedEnums"

let siteId: number
let isomerAdminEmail: string

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId

    const isomerAdmin = await seedIsomerAdminOnSite({ siteId })
    isomerAdminEmail = isomerAdmin.email
  })

  test.afterAll(async () => {
    await deleteUsersByEmail(isomerAdminEmail)
  })

  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.admin)
  })

  test("agency admin sees Isomer admins tab without row actions", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act
    await users.goto(siteId)
    await users.clickIsomerAdminsTab()

    // Assert
    await users.expectIsomerAdminBanner()
    await users.expectUserInTable(isomerAdminEmail)
    await users.expectNoActionsMenuForUser(isomerAdminEmail)
  })
})
