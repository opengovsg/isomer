import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import crypto from "crypto"
import { db } from "~/server/modules/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { seedRolesForE2E } from "./fixtures/seed"

const setSingpassUuidFor = async (email: string, uuid: string) => {
  await db
    .updateTable("User")
    .set({ singpassUuid: uuid, name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()
}

const signInOnce = async (role: keyof typeof TEST_EMAILS, baseURL: string) => {
  const email = TEST_EMAILS[role]
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  await page.goto("/sign-in")
  await loginPage.fillEmail(email)
  await page.getByText("Enter OTP").waitFor()
  await loginPage.fillToken(email)
  await page.getByRole("button", { name: "Sign in" }).click()
  await loginPage.mockpassLoginWith(uuid)
  await page.waitForURL(baseURL + "/")

  await ctx.storageState({ path: storageStateFor(role) })
  await browser.close()
}

const globalSetup = async (config: FullConfig) => {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000"

  await seedRolesForE2E()

  await Promise.all(ROLES.map((role) => signInOnce(role, baseURL)))
}

export default globalSetup
