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

const trpcHeaders = () => ({
  "content-type": "application/json",
  [APP_VERSION_HEADER_KEY]: env.NEXT_PUBLIC_APP_VERSION,
})

type EmailLoginInput = z.infer<typeof emailSignInSchema>
type EmailVerifyOtpInput = z.infer<typeof emailVerifyOtpSchema>

const trpcMutate = async (
  request: APIRequestContext,
  procedure: string,
  input: EmailLoginInput | EmailVerifyOtpInput,
) => {
  const response = await request.post(`/api/trpc/${procedure}`, {
    data: { json: input },
    headers: trpcHeaders(),
  })

  const body = (await response.json()) as
    | { error?: unknown }
    | { result?: unknown }

  if (body.error !== undefined) {
    throw new Error(
      `tRPC ${procedure} failed: ${JSON.stringify(body.error)}`,
    )
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

const signInOnce = async (role: keyof typeof TEST_EMAILS, baseURL: string) => {
  const email = TEST_EMAILS[role]
  const uuid = crypto.randomUUID()
  await setSingpassUuidFor(email, uuid)

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ baseURL })
  const { request } = ctx
  const page = await ctx.newPage()
  const loginPage = new LoginPage(page)

  // Seed the Singpass session cookie via tRPC so Playwright's request context
  // stores Set-Cookie headers (they are not exposed on page responses).
  await trpcMutate(request, "auth.email.login", { email })
  const token = await overwriteToken({
    factory: () => "123456",
    identifier: email,
  })
  await trpcMutate(request, "auth.email.verifyOtp", { email, token })

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
