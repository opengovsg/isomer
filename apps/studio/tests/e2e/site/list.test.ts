import { expect, test } from "@playwright/test"

import { roleTag } from "../fixtures/auth"

test.describe("editor", { tag: roleTag("editor") }, () => {
  test("editor sees the Sample Site seed site", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Sample Site" })).toBeVisible()
  })
})

test.describe("nomember", { tag: roleTag("nomember") }, () => {
  test("user with no permissions sees empty state", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByText("You don't have access to any sites yet."),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Sample Site" }),
    ).not.toBeVisible()
  })
})
