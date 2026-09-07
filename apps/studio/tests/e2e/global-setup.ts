/* oxlint-disable anti-slop/no-runtime-typeof, anti-slop/no-unsafe-dictionary-type -- Playwright evaluate I/O boundary */
import type { APIRequestContext, FullConfig } from "@playwright/test"
import type { z } from "zod"
import { chromium } from "@playwright/test"
import crypto from "node:crypto"
import { APP_VERSION_HEADER_KEY } from "~/constants/version"
import { env } from "~/env.mjs"
import {
  emailSignInSchema,
  emailVerifyOtpSchema,
} from "~/schemas/auth/email/signIn"
import { db } from "~/server/modules/database/database"

import { ROLES, storageStateFor, TEST_EMAILS } from "./fixtures/auth"
import { LoginPage } from "./fixtures/login"
import { seedRolesForE2E } from "./fixtures/seed"
import { overwriteToken } from "./utils"

type EmailLoginInput = z.infer<typeof emailSignInSchema>
type EmailVerifyOtpInput = z.infer<typeof emailVerifyOtpSchema>

const SESSION_COOKIE_NAME = "auth.session-token"

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
  input: EmailLoginInput | EmailVerifyOtpInput,
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

const verifyOtpInBrowser = async (
  page: Awaited<
    ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>
  >,
  input: EmailVerifyOtpInput,
) => {
  await page.evaluate(
    async ({ appVersion, headersKey, verifyInput }) => {
      const response = await fetch("/api/trpc/auth.email.verifyOtp", {
        body: JSON.stringify({ json: verifyInput }),
        credentials: "include",
        headers: {
          "content-type": "application/json",
          [headersKey]: appVersion,
        },
        method: "POST",
      })

      const body: unknown = await response.json()
      if (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        body.error !== undefined
      ) {
        throw new Error(JSON.stringify(body.error))
      }

      if (!response.ok) {
        throw new Error(`${response.status} ${JSON.stringify(body)}`)
      }
    },
    {
      appVersion: env.NEXT_PUBLIC_APP_VERSION,
      headersKey: APP_VERSION_HEADER_KEY,
      verifyInput: input,
    },
  )
}

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
  const { request } = ctx
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  await trpcMutate(request, "auth.email.login", { email })
  const token = await overwriteToken({
    factory: () => "123456",
    identifier: email,
  })

  // Seed the session cookie in the browser jar (not just APIRequestContext).
  await page.goto("/sign-in")
  await verifyOtpInBrowser(page, { email, token })

  const cookies = await ctx.cookies()
  if (!cookies.some((cookie) => cookie.name === SESSION_COOKIE_NAME)) {
    throw new Error(`Missing ${SESSION_COOKIE_NAME} after verifyOtp`)
  }

  await page.goto("/sign-in/singpass")
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
