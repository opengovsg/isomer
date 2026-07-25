import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { ROLES, roleTag, TEST_EMAILS, type Role } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"
import { SiteAdminPO } from "../fixtures/site-admin.po"
import { ensureUserOnboarded } from "../fixtures/user"

/** Exhaustive over `Role` — adding a ROLES entry fails typecheck until classified. */
const siteAdminAccessByRole = {
  core: "allowed",
  migrator: "allowed",
  editor: "denied",
  publisher: "denied",
  admin: "denied",
  nomember: "denied",
} as const satisfies Record<Role, "allowed" | "denied">

let siteId: number

test.beforeAll(async () => {
  const site = await provisionE2ESite({
    roles: [RoleType.Admin, RoleType.Editor, RoleType.Publisher],
  })
  siteId = site.siteId
})

for (const role of ROLES) {
  if (siteAdminAccessByRole[role] === "allowed") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("can view the site admin config page", async ({ page }) => {
        const siteAdmin = new SiteAdminPO(page)

        // Arrange
        // (site provisioned in beforeAll)

        // Act
        await siteAdmin.goto(siteId)

        // Assert
        await siteAdmin.expectLoaded()
      })
    })
  } else {
    test.describe(role, { tag: roleTag(role) }, () => {
      test.beforeEach(async () => {
        await ensureUserOnboarded(TEST_EMAILS[role])
      })

      test("is redirected away from the site admin config page", async ({
        page,
      }) => {
        const siteAdmin = new SiteAdminPO(page)

        // Arrange
        // (user lacks site admin access)

        // Act
        const adminResponse =
          await siteAdmin.gotoAndAwaitNavigationResponse(siteId)

        // Assert
        expect(adminResponse.status()).toBe(307)
        await siteAdmin.expectRedirectedToSiteDashboard(siteId)
      })
    })
  }
}
