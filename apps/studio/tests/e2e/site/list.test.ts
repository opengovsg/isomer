import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { storageStateFor } from "../fixtures/auth"
import { provisionE2ESite } from "../fixtures/site"

let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteName = site.siteName
})

test.describe("editor", () => {
  test.use({ storageState: storageStateFor("editor") })

  test("sees the provisioned site on the dashboard", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: siteName })).toBeVisible()
  })
})

test.describe("nomember", () => {
  test.use({ storageState: storageStateFor("nomember") })

  test("sees empty state", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByText("You don't have access to any sites yet."),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: siteName })).not.toBeVisible()
  })
})
