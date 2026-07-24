import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { ROLES, roleTag, type Role } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"

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

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

for (const role of ROLES) {
  if (siteAdminAccessByRole[role] === "allowed") {
    test.describe(role, { tag: roleTag(role) }, () => {
      test("can view the site admin config page", async ({ page }) => {
        await page.goto(`/sites/${siteId}/admin`)
        await page.waitForURL(/\/admin$/)

        await expect(page.getByText("Manage site configurations")).toBeVisible()
        await expect(
          page.getByText("Site config", { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByText("Site theme", { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByText("Site navbar", { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByText("Site footer", { exact: true }),
        ).toBeVisible()
        await expect(
          page.getByRole("button", { name: "Save settings" }),
        ).toBeVisible()
      })
    })
  } else {
    test.describe(role, { tag: roleTag(role) }, () => {
      test("is redirected away from the site admin config page", async ({
        page,
      }) => {
        const adminResponsePromise = page.waitForResponse((response) => {
          const url = new URL(response.url())
          return (
            url.pathname === `/sites/${siteId}/admin` &&
            response.request().isNavigationRequest()
          )
        })

        await page.goto(`/sites/${siteId}/admin`)
        const adminResponse = await adminResponsePromise

        expect(adminResponse.status()).toBe(307)
        await expect(page).toHaveURL(new RegExp(`/sites/${siteId}$`))
        await expect(
          page.getByText("Manage site configurations"),
        ).not.toBeVisible()
      })
    })
  }
}
