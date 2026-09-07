import type { FullConfig } from "@playwright/test"
import type { NextApiRequest, NextApiResponse } from "next"
import type { SessionData } from "~/lib/types/session"
import { chromium } from "@playwright/test"
import { getIronSession } from "iron-session"
import { createMocks } from "node-mocks-http"
import crypto from "node:crypto"
import { LOGGED_IN_KEY } from "~/constants/localStorage"
import { generateSessionOptions } from "~/server/modules/auth/session"
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

const sealUserSessionCookie = async (userId: string) => {
  const mocks = createMocks({ method: "GET" })
  const { req, res } = mocks as {
    req: NextApiRequest
    res: NextApiResponse
  }
  const sessionOptions = generateSessionOptions({ ttlInHours: 12 })
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  session.userId = userId as NonNullable<SessionData["userId"]>
  await session.save()

  const setCookieHeader = res.getHeader("set-cookie")
  if (!setCookieHeader) {
    throw new Error("iron-session did not emit a Set-Cookie header")
  }

  const cookieStrings = Array.isArray(setCookieHeader)
    ? setCookieHeader.map(String)
    : [String(setCookieHeader)]

  const sessionCookie = cookieStrings.find((cookie) =>
    cookie.startsWith(`${sessionOptions.cookieName}=`),
  )
  if (!sessionCookie) {
    throw new Error(`Missing ${sessionOptions.cookieName} in Set-Cookie header`)
  }

  const [cookiePair] = sessionCookie.split(";")
  if (!cookiePair) {
    throw new Error(`Invalid ${sessionOptions.cookieName} Set-Cookie header`)
  }
  const [, ...valueParts] = cookiePair.split("=")
  return valueParts.join("=")
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
  const sessionCookieValue = await sealUserSessionCookie(user.id)
  const { hostname, origin, protocol } = new URL(baseURL)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    baseURL,
    storageState: {
      cookies: [
        {
          domain: hostname,
          expires: Math.floor(Date.now() / 1000) + 43_200,
          httpOnly: true,
          name: sessionOptions.cookieName,
          path: "/",
          sameSite: "Lax",
          secure: protocol === "https:",
          value: sessionCookieValue,
        },
      ],
      origins: [
        {
          localStorage: [{ name: LOGGED_IN_KEY, value: JSON.stringify(true) }],
          origin,
        },
      ],
    },
  })

  const page = await ctx.newPage()
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
