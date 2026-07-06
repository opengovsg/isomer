import { expect, test } from "@playwright/test"

import { storageStateFor } from "../fixtures/auth"
import { getSeedSiteId } from "../fixtures/seed"

const allowedRoles = ["core", "migrator"] as const
const deniedRoles = ["editor", "publisher", "admin", "nomember"] as const

for (const role of allowedRoles) {
  test.describe(role, () => {
    test.use({ storageState: storageStateFor(role) })

    test("can view the site admin config page", async ({ page }) => {
      await page.goto(`/sites/${getSeedSiteId()}/admin`)
      await page.waitForURL(/\/admin$/)

      await expect(page.getByText("Manage site configurations")).toBeVisible()
      await expect(page.getByText("Site config", { exact: true })).toBeVisible()
      await expect(page.getByText("Site theme", { exact: true })).toBeVisible()
      await expect(page.getByText("Site navbar", { exact: true })).toBeVisible()
      await expect(page.getByText("Site footer", { exact: true })).toBeVisible()
      await expect(
        page.getByRole("button", { name: "Save settings" }),
      ).toBeVisible()
    })
  })
}

for (const role of deniedRoles) {
  test.describe(role, () => {
    test.use({ storageState: storageStateFor(role) })

    test("is redirected away from the site admin config page", async ({
      page,
    }) => {
      await page.goto(`/sites/${getSeedSiteId()}/admin`)

      await expect(page).toHaveURL(new RegExp(`/sites/${getSeedSiteId()}$`))
      await expect(
        page.getByText("Manage site configurations"),
      ).not.toBeVisible()
    })
  })
}
