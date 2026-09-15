import { expect, test } from "@playwright/test"

import { TEST_EMAILS } from "../fixtures/auth"
import { LoginPage } from "../fixtures/login"

test("preserves an encoded callback URL through the Singpass login flow", async ({
  page,
}) => {
  const loginPage = new LoginPage(page)
  // `search` is a synthetic parameter used to verify that an encoded `&`
  // within a callback URL is preserved rather than decoded a second time.
  const callbackUrl = "/sites/1/pages/21?search=design%26technology"

  await page.goto(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  await loginPage.fillEmail(TEST_EMAILS.editor)
  await expect(page.getByText("Enter OTP")).toBeVisible()
  await loginPage.fillToken(TEST_EMAILS.editor)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("**/sign-in/singpass?**")
  await expect(loginPage.singpassButton).toBeVisible()

  const loginRequestPromise = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      request.url().includes("/api/trpc/auth.singpass.login"),
  )
  await loginPage.singpassButton.click()
  const loginRequest = await loginRequestPromise
  const requestBody = loginRequest.postDataJSON() as {
    json: { landingUrl: string }
  }

  expect(requestBody.json.landingUrl).toBe(callbackUrl)
})
