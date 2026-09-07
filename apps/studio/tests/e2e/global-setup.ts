import type { BrowserContext, Cookie, FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import crypto from "node:crypto"
import { db } from "~/server/modules/database/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { seedRolesForE2E } from "./fixtures/seed"

const setSingpassUuidFor = async (email: string, uuid: string) => {
  await db
    .updateTable("User")
    .set({ name: "test-e2e", phone: "82345678", singpassUuid: uuid })
    .where("email", "=", email)
    .execute()
}

const addCookiesFromResponse = async (
  ctx: BrowserContext,
  baseURL: string,
  setCookieHeader: string | string[],
) => {
  const cookieStrings = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader]

  await ctx.addCookies(
    cookieStrings.map((cookieString) => {
      const [nameValue, ...attributeParts] = cookieString.split(";")
      const [name, ...valueParts] = nameValue.trim().split("=")

      let httpOnly = false
      let secure = false
      let sameSite: Cookie["sameSite"]

      for (const attribute of attributeParts) {
        const [rawKey, ...rawValueParts] = attribute.trim().split("=")
        const key = rawKey.toLowerCase()
        const attributeValue = rawValueParts.join("=")

        if (key === "httponly") {
          httpOnly = true
        } else if (key === "secure") {
          secure = true
        } else if (key === "samesite") {
          sameSite = attributeValue as Cookie["sameSite"]
        }
      }

      return {
        httpOnly,
        name,
        sameSite,
        secure,
        url: baseURL,
        value: valueParts.join("="),
      } satisfies Cookie
    }),
  )
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

  const [verifyOtpResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("verifyOtp") && response.status() === 200,
    ),
    page.getByRole("button", { name: "Sign in" }).click(),
  ])

  const setCookieHeader = verifyOtpResponse.headers()["set-cookie"]
  if (setCookieHeader) {
    await addCookiesFromResponse(ctx, baseURL, setCookieHeader)
  }

  await page.goto("/sign-in/singpass")
  await loginPage.mockpassLoginWith(uuid)
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
