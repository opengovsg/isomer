import type { FullConfig } from "@playwright/test"
import { chromium } from "@playwright/test"
import { sealData } from "iron-session"
import crypto from "node:crypto"
import { LOGGED_IN_KEY } from "~/constants/localStorage"
import {
  generateSessionOptions,
  getIronPassword,
} from "~/server/modules/auth/session"
import { db } from "~/server/modules/database/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { seedRolesForE2E } from "./fixtures/seed"

const ensureSingpassUser = async (email: string) => {
  await db
    .updateTable("User")
    .set({
      name: "test-e2e",
      phone: "82345678",
      singpassUuid: crypto.randomUUID(),
    })
    .where("email", "=", email)
    .execute()
}

const createAuthenticatedStorageState = async (
  role: keyof typeof TEST_EMAILS,
  baseURL: string,
) => {
  const email = TEST_EMAILS[role]
  await ensureSingpassUser(email)

  const user = await db
    .selectFrom("User")
    .select(["id"])
    .where("email", "=", email)
    .executeTakeFirstOrThrow()

  const sessionOptions = generateSessionOptions({ ttlInHours: 12 })
  const sealed = await sealData(
    { userId: user.id },
    {
      password: getIronPassword(),
      ttl: sessionOptions.ttl,
    },
  )

  const { protocol } = new URL(baseURL)
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  await ctx.addCookies([
    {
      httpOnly: true,
      name: sessionOptions.cookieName,
      sameSite: "Lax",
      secure: protocol === "https:",
      url: baseURL,
      value: sealed,
    },
  ])

  const page = await ctx.newPage()
  await page.addInitScript((storageKey) => {
    globalThis.localStorage.setItem(storageKey, JSON.stringify(true))
  }, LOGGED_IN_KEY)

  await page.goto("/")
  await page.waitForResponse(
    (response) =>
      response.url().includes("me.get") && response.status() === 200,
  )

  await ctx.storageState({ path: storageStateFor(role) })
  await browser.close()
}

const globalSetup = async (config: FullConfig) => {
  const baseURL = config.projects[0]?.use.baseURL ?? "http://127.0.0.1:3000"

  await seedRolesForE2E()

  for (const role of ROLES) {
    await createAuthenticatedStorageState(role, baseURL)
  }
}

export default globalSetup
