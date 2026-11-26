import { expect, test } from "@playwright/test"

test("go to /sign-in", async ({ page }) => {
  // Act
  await page.goto("/sign-in")

  // Assert
  await expect(page.getByText(`Isomer Studio`).first()).toBeVisible()
})

test("does not start Datadog RUM", async ({ page }) => {
  // Act
  await page.goto("/sign-in")

  // Assert
  const rumConfig = await page.evaluate(() =>
    (
      window as Window & {
        DD_RUM?: { getInitConfiguration: () => unknown }
      }
    ).DD_RUM?.getInitConfiguration(),
  )
  expect(rumConfig).toBeUndefined()
})

test("test 404", async ({ page }) => {
  // Act
  const res = await page.goto("/not-found")

  // Assert
  expect(res?.status()).toBe(404)
})
