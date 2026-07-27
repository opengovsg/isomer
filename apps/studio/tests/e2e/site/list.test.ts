import { expect, test } from "@playwright/test"

import { storageStateFor } from "../fixtures/auth"

test.describe("site list", () => {
  test("editor sees the Sample Site seed site", async ({
    browser,
    baseURL,
  }) => {
    const ctx = await browser.newContext({
      baseURL,
      storageState: storageStateFor("editor"),
    })
    const page = await ctx.newPage()
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Sample Site" })).toBeVisible()
    await ctx.close()
  })

  test("user with no permissions sees empty state", async ({
    browser,
    baseURL,
  }) => {
    const ctx = await browser.newContext({
      baseURL,
      storageState: storageStateFor("nomember"),
    })
    const page = await ctx.newPage()
    await page.goto("/")

    await expect(
      page.getByText("You don't have access to any sites yet."),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Sample Site" }),
    ).not.toBeVisible()
    await ctx.close()
  })
})
