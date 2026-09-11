import { expect, test, type Page } from "@playwright/test"

import { roleTag } from "../fixtures/auth"

const GODMODE_ROUTES = [
  { path: "/godmode/create-site", heading: "Create a new site" },
  { path: "/godmode/publishing", heading: "Publishing" },
  { path: "/godmode/whitelist", heading: "Whitelist" },
] as const

const expectRedirectToDashboard = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForURL("/")
  await expect(page).toHaveURL(/\/$/)
}

test.describe("core", { tag: roleTag("core") }, () => {
  test("core admin can access all godmode routes", async ({ page }) => {
    await page.goto("/godmode")
    await expect(page.getByRole("heading", { name: /God Mode/ })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Create a new site" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Publishing" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Whitelist" })).toBeVisible()

    for (const route of GODMODE_ROUTES) {
      await page.goto(route.path)
      await expect(
        page.getByRole("heading", { name: route.heading }),
      ).toBeVisible()
    }
  })
})

test.describe("migrator", { tag: roleTag("migrator") }, () => {
  test("migrator can only access whitelist godmode routes", async ({
    page,
  }) => {
    await page.goto("/godmode")
    await expect(page.getByRole("heading", { name: /God Mode/ })).toBeVisible()
    await expect(page.getByRole("link", { name: "Whitelist" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Create a new site" }),
    ).not.toBeVisible()
    await expect(
      page.getByRole("link", { name: "Publishing" }),
    ).not.toBeVisible()

    await page.goto("/godmode/whitelist")
    await expect(page.getByRole("heading", { name: "Whitelist" })).toBeVisible()

    await expectRedirectToDashboard(page, "/godmode/create-site")
    await expectRedirectToDashboard(page, "/godmode/publishing")
  })
})

test.describe("admin", { tag: roleTag("admin") }, () => {
  test("site admin without godmode access is redirected", async ({ page }) => {
    await expectRedirectToDashboard(page, "/godmode")
    for (const route of GODMODE_ROUTES) {
      await expectRedirectToDashboard(page, route.path)
    }
  })
})
