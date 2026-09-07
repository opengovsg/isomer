import type { FullConfig } from "@playwright/test"
import type { NextApiRequest, NextApiResponse } from "next"
import type { SessionData } from "~/lib/types/session"
import { chromium, request } from "@playwright/test"
import { getIronSession } from "iron-session"
import { createMocks } from "node-mocks-http"
import crypto from "node:crypto"
import { LOGGED_IN_KEY } from "~/constants/localStorage"
import { APP_VERSION_HEADER_KEY } from "~/constants/version"
import { env } from "~/env.mjs"
import { generateSessionOptions } from "~/server/modules/auth/session"
import { db } from "~/server/modules/database/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { seedRolesForE2E } from "./fixtures/seed"
import { overwriteToken } from "./utils"

const trpcHeaders = {
  "content-type": "application/json",
  [APP_VERSION_HEADER_KEY]: env.NEXT_PUBLIC_APP_VERSION,
}

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

const parseSessionCookieValue = (setCookieHeader: string | string[]) => {
  const { cookieName } = generateSessionOptions({ ttlInHours: 12 })
  const cookieStrings = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader]

  const sessionCookie = cookieStrings.find((cookie) =>
    cookie.startsWith(`${cookieName}=`),
  )
  if (!sessionCookie) {
    throw new Error(`Missing ${cookieName} in Set-Cookie header`)
  }

  const [, ...valueParts] = sessionCookie.split(";")[0].split("=")
  return valueParts.join("=")
}

const sealUserSessionCookie = async (userId: string) => {
  const mocks = createMocks({ method: "GET" })
  // SAFETY: node-mocks-http createMocks returns compatible Next.js API types for tests.
  const { req, res } = mocks as {
    req: NextApiRequest
    res: NextApiResponse
  }
  const session = await getIronSession<SessionData>(
    req,
    res,
    generateSessionOptions({ ttlInHours: 12 }),
  )
  session.userId = userId as NonNullable<SessionData["userId"]>
  await session.save()

  const setCookieHeader = res.getHeader("set-cookie")
  if (!setCookieHeader) {
    throw new Error("iron-session did not emit a Set-Cookie header")
  }

  return parseSessionCookieValue(setCookieHeader)
}

const tryVerifyOtpViaApi = async (baseURL: string, email: string) => {
  const api = await request.newContext({ baseURL })
  const loginResponse = await api.post("/api/trpc/auth.email.login", {
    data: { json: { email } },
    headers: trpcHeaders,
  })
  if (!loginResponse.ok()) {
    throw new Error(`login failed with status ${loginResponse.status()}`)
  }

  const token = await overwriteToken({
    factory: () => "123456",
    identifier: email,
  })

  const verifyResponse = await api.post("/api/trpc/auth.email.verifyOtp", {
    data: { json: { email, token } },
    headers: trpcHeaders,
  })
  if (!verifyResponse.ok()) {
    await api.dispose()
    return null
  }

  const storageState = await api.storageState()
  const { cookies } = storageState
  await api.dispose()
  return cookies
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

  const apiCookies = await tryVerifyOtpViaApi(baseURL, email)
  const sessionOptions = generateSessionOptions({ ttlInHours: 12 })
  const matchingCookie = apiCookies?.find(
    (cookie) => cookie.name === sessionOptions.cookieName,
  )
  const sealedCookie = await sealUserSessionCookie(user.id)
  const sessionCookieValue = matchingCookie?.value ?? sealedCookie

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
      value: sessionCookieValue,
    },
  ])

  const page = await ctx.newPage()
  await page.addInitScript((storageKey) => {
    globalThis.localStorage.setItem(storageKey, JSON.stringify(true))
  }, LOGGED_IN_KEY)

  const meResponse = await page.request.get(
    `${baseURL}/api/trpc/me.get?input=${encodeURIComponent(JSON.stringify({ json: null }))}`,
    { headers: trpcHeaders },
  )
  if (!meResponse.ok()) {
    throw new Error(
      `me.get failed with status ${meResponse.status()}: ${await meResponse.text()}`,
    )
  }

  await page.goto("/")
  await page.getByText("Your sites").waitFor({ state: "visible" })

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
