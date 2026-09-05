import { test } from "@playwright/test"
import { roleTag, TEST_EMAILS } from "~e2e/fixtures/auth"
import { UsersPO } from "~e2e/fixtures/po"
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

test.describe("publisher", { tag: roleTag("publisher") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.publisher)
  })

  test("publisher cannot manage users on the collaborators page", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act / Assert
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

    // Arrange / Act / Assert
    await users.goto(siteId)
    await users.expectReadOnlyCollaboratorsDescription()
    await users.expectCannotAddNewUser()
    await users.expectNoRowActionsMenus()
  })
})

test.describe("nomember", { tag: roleTag("nomember") }, () => {
  test.beforeEach(async () => {
    await ensureUserOnboarded(TEST_EMAILS.nomember)
  })

  test("nomember cannot access the collaborators page without site permission", async ({
    page,
  }) => {
    const users = new UsersPO(page)

    // Arrange / Act / Assert
    await users.goto(siteId)
    await users.expectNoSiteAccessError()
    await users.expectCollaboratorsPageHidden()
  })
})
