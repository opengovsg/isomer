import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteIsomerAdmin,
  deleteUsersByEmailPattern,
  ensureUserOnboarded,
  seedIsomerAdminOnSite,
} from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

let siteId: number
let isomerAdminEmail: string
let isomerAdminUserId: string

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId

    const isomerAdmin = await seedIsomerAdminOnSite({ siteId })
    isomerAdminEmail = isomerAdmin.email
    isomerAdminUserId = isomerAdmin.userId
  })

  test.afterAll(async () => {
    await deleteIsomerAdmin(isomerAdminUserId)
    await deleteUsersByEmailPattern("e2e-isomer-admin-%@open.gov.sg")
    await teardownE2ESite(siteId)
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
