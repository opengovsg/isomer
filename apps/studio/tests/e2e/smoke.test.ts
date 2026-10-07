import { expect, test } from "@playwright/test"

test("go to /sign-in", async ({ page }) => {
  // Act
  await page.goto("/sign-in")

  // Assert
  await expect(page.getByText(`Isomer Studio`).first()).toBeVisible()
})

test("test 404", async ({ page }) => {
  // Act
  const res = await page.goto("/not-found")

  // Assert
  expect(res?.status()).toBe(404)
})
