import { test } from "@playwright/test"

import { ROLES, roleTag, TEST_EMAILS, type Role } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"
import { ensureUserOnboarded } from "../fixtures/user"

const RESTRICTED_GODMODE_PATHS = [
  "/godmode",
  "/godmode/create-site",
  "/godmode/publishing",
  "/godmode/whitelist",
] as const

const CORE_ONLY_GODMODE_PATHS = [
  "/godmode/create-site",
  "/godmode/publishing",
] as const

const FULL_ACCESS_GODMODE_PATHS = [
  "/godmode/create-site",
  "/godmode/publishing",
  "/godmode/whitelist",
] as const

/** Exhaustive over `Role` — adding a ROLES entry fails typecheck until classified. */
const godmodeAccessByRole = {
  core: "full",
  migrator: "whitelist-only",
  editor: "denied",
  publisher: "denied",
  admin: "denied",
  nomember: "denied",
} as const satisfies Record<Role, "full" | "whitelist-only" | "denied">

for (const role of ROLES) {
  const access = godmodeAccessByRole[role]

  if (access === "full") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("can access the godmode hub", async ({ page }) => {
        const godmode = new GodmodePO(page)

        // Act
        await godmode.gotoHub()

        // Assert
        await godmode.expectHubLinkVisible("Create a new site")
        await godmode.expectHubLinkVisible("Publishing")
        await godmode.expectHubLinkVisible("Whitelist")
      })

      for (const path of FULL_ACCESS_GODMODE_PATHS) {
        test(`can access ${path}`, async ({ page }) => {
          const godmode = new GodmodePO(page)

          // Act
          await godmode.gotoRoute(path)

          // Assert — route-specific heading is asserted inside gotoRoute
        })
      }
    })
  } else if (access === "whitelist-only") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("can access the godmode hub with whitelist only", async ({
        page,
      }) => {
        const godmode = new GodmodePO(page)

        // Act
        await godmode.gotoHub()

        // Assert
        await godmode.expectHubLinkVisible("Whitelist")
        await godmode.expectHubLinkHidden("Create a new site")
        await godmode.expectHubLinkHidden("Publishing")
      })

      test("can access the whitelist route", async ({ page }) => {
        const godmode = new GodmodePO(page)

        // Act
        await godmode.gotoWhitelist()

        // Assert — heading is asserted inside gotoWhitelist
      })

      for (const path of CORE_ONLY_GODMODE_PATHS) {
        test(`is redirected away from ${path}`, async ({ page }) => {
          const godmode = new GodmodePO(page)

          // Act / Assert
          await godmode.expectRedirectToDashboard(path)
        })
      }
    })
  } else {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      for (const path of RESTRICTED_GODMODE_PATHS) {
        test(`is redirected away from ${path}`, async ({ page }) => {
          const godmode = new GodmodePO(page)

          // Act / Assert
          await godmode.expectRedirectToDashboard(path)
        })
      }
    })
  }
}
