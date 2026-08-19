import { test } from "@playwright/test"

import { ROLES, roleTag, type Role } from "../fixtures/auth"
import { GodmodePO } from "../fixtures/godmode.po"

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
      test("can access all godmode routes", async ({ page }) => {
        const godmode = new GodmodePO(page)

        await godmode.gotoHub()
        await godmode.expectHubLinkVisible("Create a new site")
        await godmode.expectHubLinkVisible("Publishing")
        await godmode.expectHubLinkVisible("Whitelist")

        await godmode.gotoCreateSite()
        await godmode.gotoPublishing()
        await godmode.gotoWhitelist()
      })
    })
  } else if (access === "whitelist-only") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test("can only access whitelist godmode routes", async ({ page }) => {
        const godmode = new GodmodePO(page)

        await godmode.gotoHub()
        await godmode.expectHubLinkVisible("Whitelist")
        await godmode.expectHubLinkHidden("Create a new site")
        await godmode.expectHubLinkHidden("Publishing")

        await godmode.gotoWhitelist()

        for (const path of CORE_ONLY_GODMODE_PATHS) {
          await godmode.expectRedirectToDashboard(path)
        }
      })
    })
  } else {
    test.describe(role, { tag: roleTag(role) }, () => {
      test("is redirected away from all godmode routes", async ({ page }) => {
        const godmode = new GodmodePO(page)

        for (const path of RESTRICTED_GODMODE_PATHS) {
          await godmode.expectRedirectToDashboard(path)
        }
      })
    })
  }
}
