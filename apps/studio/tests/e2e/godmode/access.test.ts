import { expect, test, type Browser, type Page } from "@playwright/test"

import { storageStateFor, type Role } from "../fixtures/auth"

const GODMODE_ROUTES = [
  { path: "/godmode/create-site", heading: "Create a new site" },
  { path: "/godmode/publishing", heading: "Publishing" },
  { path: "/godmode/whitelist", heading: "Whitelist" },
] as const

const openAs = async (
  browser: Browser,
  baseURL: string | undefined,
  role: Role,
) => {
  const ctx = await browser.newContext({
    baseURL,
    storageState: storageStateFor(role),
  })
  const page = await ctx.newPage()
  return { ctx, page }
}

const expectRedirectToDashboard = async (page: Page, path: string) => {
  await page.goto(path)
  await page.waitForURL("/")
  await expect(page).toHaveURL(/\/$/)
}

test.describe("godmode access", () => {
  test("core admin can access all godmode routes", async ({
    browser,
    baseURL,
  }) => {
    const { ctx, page } = await openAs(browser, baseURL, "core")

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

    await ctx.close()
  })

  test("migrator can only access whitelist godmode routes", async ({
    browser,
    baseURL,
  }) => {
    const { ctx, page } = await openAs(browser, baseURL, "migrator")

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

    await ctx.close()
  })

  test("site admin without godmode access is redirected", async ({
    browser,
    baseURL,
  }) => {
    const { ctx, page } = await openAs(browser, baseURL, "admin")

    await expectRedirectToDashboard(page, "/godmode")
    for (const route of GODMODE_ROUTES) {
      await expectRedirectToDashboard(page, route.path)
    }

    await ctx.close()
  })
})
