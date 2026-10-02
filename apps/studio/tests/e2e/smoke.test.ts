import { expect, test } from "@playwright/test"
import { LOGGED_IN_KEY } from "~/constants/localStorage"

test("go to /sign-in", async ({ page }) => {
  await page.goto("/sign-in")

  const text = page.getByText(`Isomer Studio`).first()

  await expect(text).toBeVisible()
})

test("preserves the requested page when redirecting to sign in", async ({
  page,
}) => {
  await page.addInitScript(
    (loggedInKey) => window.localStorage.setItem(loggedInKey, "true"),
    LOGGED_IN_KEY,
  )
  await page.goto("/sites/1/pages/21")

  await expect(page).toHaveURL("/sign-in?callbackUrl=%2Fsites%2F1%2Fpages%2F21")
})

test("test 404", async ({ page }) => {
  const res = await page.goto("/not-found")
  expect(res?.status()).toBe(404)
})
