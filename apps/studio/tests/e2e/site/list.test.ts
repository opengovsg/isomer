import { expect, test } from "@playwright/test"
import { RoleType } from "~prisma/generated/generatedEnums"

import { roleTag } from "../fixtures/auth"
import { provisionE2ESite, teardownE2ESite } from "../fixtures/site"

let siteId: number
let siteName: string

test.beforeAll(async () => {
  const site = await provisionE2ESite({ roles: [RoleType.Editor] })
  siteId = site.siteId
  siteName = site.siteName
})

test.afterAll(async () => {
  await teardownE2ESite(siteId)
})

test.describe("editor", { tag: roleTag("editor") }, () => {
  test("editor sees their provisioned site on the dashboard", async ({
    page,
  }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: "Your sites" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: siteName })).toBeVisible()
  })
})

test.describe("nomember", { tag: roleTag("nomember") }, () => {
  test("user with no permissions sees empty state", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByText("You don't have access to any sites yet."),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: siteName })).not.toBeVisible()
  })
})
