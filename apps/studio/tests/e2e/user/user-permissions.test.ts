import { test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { ROLES, TEST_EMAILS, roleTag, type Role } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"
import { ensureUserOnboarded } from "../fixtures/user"
import { UsersPO } from "../fixtures/users.po"

/**
 * Permission gates for the collaborators page — who cannot manage users.
 *
 * `userManageAccessByRole` classifies every Playwright role for exhaustiveness,
 * but this file only implements denied cases (read-only UI or no site access).
 * Roles marked `"allowed"` exercise happy paths in sibling `user/*.test.ts` files
 * (e.g. `invite-user.test.ts` for agency admin invite flows).
 *
 * Godmode (`core` / `migrator`) manage-users coverage is deferred to a follow-up
 * outside this PR.
 */
/** Exhaustive over `Role` — adding a ROLES entry fails typecheck until classified. */
const userManageAccessByRole = {
  core: "allowed",
  migrator: "allowed",
  editor: "read_only",
  publisher: "read_only",
  admin: "allowed",
  nomember: "no_site_access",
} as const satisfies Record<Role, "allowed" | "read_only" | "no_site_access">

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
  } else if (userManageAccessByRole[role] === "no_site_access") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("cannot access the collaborators page without site permission", async ({
        page,
      }) => {
        const users = new UsersPO(page)

        // Arrange / Act
        await users.goto(siteId)

        // Assert
        await users.expectNoSiteAccessError()
        await users.expectCollaboratorsPageHidden()
      })
    })
  }
}
