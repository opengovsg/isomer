import { expect, test } from "@playwright/test"

// This is the smoke suite: unauthenticated, read-only, idempotent checks that are
// safe to run against a LIVE, SHARED environment (e.g. staging ECS after a deploy).
// It verifies the deployment is alive and correctly wired — NOT that any specific
// change behaves correctly. Keep it fast and few.
//
// It is selected by file path (playwright.smoke.config.ts) and runs WITHOUT the
// e2e globalSetup, which seeds a local DB and must never touch a real environment.

test("sign-in page renders (app boots + serves HTML/CSS/JS)", async ({
  page,
}) => {
  await page.goto("/sign-in")

  const text = page.getByText(`Isomer Studio`).first()

  await expect(text).toBeVisible()
})

test("unknown route returns 404 (routing wired)", async ({ page }) => {
  const res = await page.goto("/not-found")
  expect(res?.status()).toBe(404)
})

test("root redirects unauthenticated users to sign-in (auth wired)", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/sign-in/)
})
