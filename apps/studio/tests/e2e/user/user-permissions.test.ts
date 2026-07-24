import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { TEST_EMAILS, roleTag } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

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

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher cannot manage users on the collaborators page", async ({
    page,
  }) => {
    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.expectReadOnlyCollaboratorsDescription()
    await users.expectCannotAddNewUser()
    await users.expectNoRowActionsMenus()
  })
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.editor)
  })

  test("editor cannot manage users on the collaborators page", async ({
    page,
  }) => {
    const users = new UsersPO(page)
    await users.goto(siteId)
    await users.expectReadOnlyCollaboratorsDescription()
    await users.expectCannotAddNewUser()
    await users.expectNoRowActionsMenus()
  })
})
