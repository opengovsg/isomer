import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import { db } from "~/server/modules/database/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { seedRolesForE2E } from "./fixtures/seed"

const signInOnce = async (role: keyof typeof TEST_EMAILS, baseURL: string) => {
  const email = TEST_EMAILS[role]

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  await page.goto("/sign-in")
  await loginPage.fillEmail(email)
  await page.getByText("Enter OTP").waitFor()
  await loginPage.fillToken(email)
  await page.getByRole("button", { name: "Sign in" }).click()
  // Singpass is disabled in NEXT_PUBLIC_APP_ENV=test, so OTP completes login.
  await page.waitForURL(`${baseURL}/`)

  await ctx.storageState({ path: storageStateFor(role) })
  await browser.close()
}

const globalSetup = async (config: FullConfig) => {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000"

  await seedRolesForE2E()

  for (const role of ROLES) {
    await signInOnce(role, baseURL)
  }
}

export default globalSetup
