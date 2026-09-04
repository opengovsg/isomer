import { expect, test } from "@playwright/test"

test("go to /sign-in", async ({ page }) => {
  await page.goto("/sign-in")

  const text = page.getByText(`Isomer Studio`).first()

  await expect(text).toBeVisible()
})

test("test 404", async ({ page }) => {
  const res = await page.goto("/not-found")
  expect(res?.status()).toBe(404)
})
