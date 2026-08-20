import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { ROLES, TEST_EMAILS, roleTag, type Role } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

/** Exhaustive over `Role` — adding a ROLES entry fails typecheck until classified. */
const userManageAccessByRole = {
  core: "allowed",
  migrator: "allowed",
  editor: "read_only",
  publisher: "read_only",
  admin: "allowed",
  nomember: "redirected",
} as const satisfies Record<Role, "allowed" | "read_only" | "redirected">

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

for (const role of ROLES) {
  if (userManageAccessByRole[role] === "read_only") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("cannot manage users on the collaborators page", async ({
        page,
      }) => {
        const users = new UsersPO(page)

        // Arrange / Act
        await users.goto(siteId)

        // Assert
        await users.expectReadOnlyCollaboratorsDescription()
        await users.expectCannotAddNewUser()
        await users.expectNoRowActionsMenus()
      })
    })
  } else if (userManageAccessByRole[role] === "redirected") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("is redirected away from the collaborators page", async ({
        page,
      }) => {
        const users = new UsersPO(page)

        // Arrange / Act
        await users.expectRedirectedFromUsersPage(siteId)

        // Assert
        await users.expectCollaboratorsPageHidden()
      })
    })
  }
}
