/* oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unsafe-dictionary-type -- Playwright evaluate I/O boundary */
import type { APIRequestContext, FullConfig } from "@playwright/test"
import type { z } from "zod"
import type { SessionData } from "~/lib/types/session"
import { chromium } from "@playwright/test"
import { sealData } from "iron-session"
import crypto from "node:crypto"
import { APP_VERSION_HEADER_KEY } from "~/constants/version"
import { env } from "~/env.mjs"
import { emailSignInSchema } from "~/schemas/auth/email/signIn"
import {
  generateSessionOptions,
  getIronPassword,
} from "~/server/modules/auth/session"
import { db } from "~/server/modules/database/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { seedRolesForE2E } from "./fixtures/seed"

type EmailLoginInput = z.infer<typeof emailSignInSchema>

const trpcHeaders = () => ({
  "content-type": "application/json",
  [APP_VERSION_HEADER_KEY]: env.NEXT_PUBLIC_APP_VERSION,
})

const isTrpcErrorResponse = (
  body: unknown,
): body is { error: unknown } & Record<string, unknown> =>
  typeof body === "object" && body !== null && "error" in body

const trpcMutate = async (
  request: APIRequestContext,
  procedure: string,
  input: EmailLoginInput,
) => {
  const response = await request.post(`/api/trpc/${procedure}`, {
    data: { json: input },
    headers: trpcHeaders(),
  })

  const body: unknown = await response.json()

  if (isTrpcErrorResponse(body)) {
    throw new Error(`tRPC ${procedure} failed: ${JSON.stringify(body.error)}`)
  }

  if (!response.ok()) {
    throw new Error(
      `tRPC ${procedure} failed: ${response.status()} ${JSON.stringify(body)}`,
    )
  }
}

const setSingpassUuidFor = async (email: string, uuid: string) => {
  await db
    .updateTable("User")
    .set({ singpassUuid: uuid, name: "test-e2e", phone: "82345678" })
    .where("email", "=", email)
    .execute()
}

const seedSingpassSessionCookie = async (
  ctx: Awaited<
    ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newContext"]>
  >,
  baseURL: string,
  email: string,
) => {
  const user = await db
    .selectFrom("User")
    .select(["id"])
    .where("email", "=", email)
    .executeTakeFirstOrThrow()

  const verificationToken = await db
    .selectFrom("VerificationToken")
    .selectAll()
    .where("identifier", "like", `${email}|%`)
    .executeTakeFirstOrThrow()

  const sessionOptions = generateSessionOptions({ ttlInHours: 12 })
  const sessionData: SessionData = {
    singpass: {
      sessionState: {
        codeVerifier: "",
        userId: user.id as NonNullable<
          NonNullable<SessionData["singpass"]>["sessionState"]
        >["userId"],
        verificationToken,
      },
    },
  }

  const sealedSession = await sealData(sessionData, {
    password: getIronPassword(),
    ttl: sessionOptions.ttl,
  })

  const { hostname, protocol } = new URL(baseURL)
  await ctx.addCookies([
    {
      domain: hostname,
      expires: Math.floor(Date.now() / 1000) + 43_200,
      httpOnly: true,
      name: sessionOptions.cookieName,
      path: "/",
      sameSite: "Lax",
      secure: protocol === "https:",
      value: sealedSession,
    },
  ])
}

const signInOnce = async (role: keyof typeof TEST_EMAILS, baseURL: string) => {
  const email = TEST_EMAILS[role]
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const { request } = ctx
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  await trpcMutate(request, "auth.email.login", { email })
  await seedSingpassSessionCookie(ctx, baseURL, email)

  await page.goto("/sign-in/singpass")

  const getUserPropsDiagnostics = await page.evaluate(
    async ({ appVersion, headersKey }) => {
      const response = await fetch("/api/trpc/auth.singpass.getUserProps", {
        credentials: "include",
        headers: {
          [headersKey]: appVersion,
        },
      })

      return {
        status: response.status,
        text: await response.text(),
      }
    },
    {
      appVersion: env.NEXT_PUBLIC_APP_VERSION,
      headersKey: APP_VERSION_HEADER_KEY,
    },
  )

  if (!getUserPropsDiagnostics.text.includes('"name"')) {
    throw new Error(
      `getUserProps failed: ${JSON.stringify(getUserPropsDiagnostics)}`,
    )
  }

  await loginPage.singpassButton.waitFor({ state: "visible" })
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
