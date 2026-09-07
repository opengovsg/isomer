import type { BrowserContext, FullConfig } from "@playwright/test"
import type { VerificationToken } from "~/server/modules/database/types"
import { chromium } from "@playwright/test"
import { sealData } from "iron-session"
import crypto from "node:crypto"
import {
  generateSessionOptions,
  getIronPassword,
} from "~/server/modules/auth/session"
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

const injectSingpassSessionCookie = async (
  ctx: BrowserContext,
  baseURL: string,
  email: string,
  verificationToken: VerificationToken,
) => {
  const user = await db
    .selectFrom("User")
    .select(["id"])
    .where("email", "=", email)
    .executeTakeFirstOrThrow()

  const sessionOptions = generateSessionOptions({ ttlInHours: 1 })
  const sealed = await sealData(
    {
      singpass: {
        sessionState: {
          userId: user.id,
          verificationToken,
        },
      },
    },
    {
      password: getIronPassword(),
      ttl: sessionOptions.ttl,
    },
  )

  const hostname = new URL(baseURL).hostname
  await ctx.addCookies([
    {
      domain: hostname,
      httpOnly: true,
      name: sessionOptions.cookieName,
      path: "/",
      sameSite: "Lax",
      secure: hostname !== "localhost" && hostname !== "127.0.0.1",
      value: sealed,
    },
  ])
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
  const verificationToken = await db
    .selectFrom("VerificationToken")
    .selectAll()
    .where("identifier", "like", `${email}|%`)
    .executeTakeFirst()

  if (!verificationToken) {
    throw new Error(`No verification token found for ${email}`)
  }

  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForResponse(
    (response) =>
      response.url().includes("verifyOtp") && response.status() === 200,
  )
  await injectSingpassSessionCookie(ctx, baseURL, email, verificationToken)
  await page.goto("/sign-in/singpass")
  await loginPage.singpassButton.waitFor({ state: "visible" })
  await loginPage.mockpassLoginWith(uuid)
  await page.waitForURL(`${baseURL}/`)

  await ctx.storageState({ path: storageStateFor(role) })
  await browser.close()
}

const globalSetup = async (config: FullConfig) => {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://localhost:3000"

  await seedRolesForE2E()

  for (const role of ROLES) {
    await signInOnce(role, baseURL)
  }
}

export default globalSetup
