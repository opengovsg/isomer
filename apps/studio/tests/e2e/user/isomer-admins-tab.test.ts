import { test } from "@playwright/test"
import crypto from "crypto"
import {
  setupAdminPermissions,
  setupUser,
} from "tests/integration/helpers/seed"
import { MOCK_STORY_DATE } from "tests/msw/constants"
import { db } from "~/server/modules/database"
import { IsomerAdminRole, RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import {
  deleteUsersByEmailPattern,
  ensureUserOnboarded,
} from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

const isomerAdminEmailFactory = () =>
  `e2e-isomer-admin-${crypto.randomUUID().slice(0, 8)}@open.gov.sg`

let siteId: number
let isomerAdminEmail: string
let isomerAdminUserId: string

test.describe("admin", { tag: roleTag("admin") }, () => {
  test.beforeAll(async () => {
    const site = await provisionE2ESite({ roles: [RoleType.Admin] })
    siteId = site.siteId

    isomerAdminEmail = isomerAdminEmailFactory()
    const isomerAdmin = await setupUser({
      email: isomerAdminEmail,
      name: "E2E Isomer Admin",
      lastLoginAt: MOCK_STORY_DATE,
    })
    isomerAdminUserId = isomerAdmin.id
    await setupAdminPermissions({ userId: isomerAdmin.id, siteId })
    await db
      .insertInto("IsomerAdmin")
      .values({
        userId: isomerAdmin.id,
        role: IsomerAdminRole.Core,
        expiry: null,
      })
      .execute()
  })

  test.afterAll(async () => {
    await db
      .deleteFrom("IsomerAdmin")
      .where("userId", "=", isomerAdminUserId)
      .execute()
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
    await users.goto(siteId)
    await users.clickIsomerAdminsTab()
    await users.expectIsomerAdminBanner()
    await users.expectUserInTable(isomerAdminEmail)
    await users.expectNoActionsMenuForUser(isomerAdminEmail)
  })
})
