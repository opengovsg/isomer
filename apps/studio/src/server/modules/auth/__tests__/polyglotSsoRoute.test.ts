import type { NextApiRequest, NextApiResponse } from "next"
import { sealData } from "iron-session"
import {
  exportPKCS8,
  exportSPKI,
  generateKeyPair,
  importSPKI,
  jwtVerify,
} from "jose"
import { createMocks } from "node-mocks-http"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupEditorPermissions,
  setupIsomerAdmin,
  setupPublisherPermissions,
  setupSite,
  setupUser,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

// Mutable so each test can toggle the Polyglot vars; the route reads env per
// request. The DB still uses the real connection string from `.env.test`.
const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    // oxlint-disable-next-line node/no-process-env
    NODE_ENV: process.env.NODE_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? "test",
    // oxlint-disable-next-line node/no-process-env
    DATABASE_URL: process.env.DATABASE_URL,
    SESSION_SECRET: "test-session-secret-at-least-32-chars-long",
  } as Record<string, string | undefined>,
}))
vi.mock("~/env.mjs", () => ({ env: mockEnv }))

import { DEFAULT_POLYGLOT_STUDIO_URL } from "~/constants/polyglot"
import handler from "~/pages/api/polyglot/sso"

const POLYGLOT_URL = "https://staging-studio.polyglot.gov.sg"
let publicKeyPem: string
let privateKeyPem: string

const callRoute = async ({
  userId,
  siteId,
}: {
  userId?: string
  siteId: number
}) => {
  const cookie = userId
    ? `auth.session-token=${await sealData(
        { userId },
        { password: { "1": mockEnv.SESSION_SECRET! } },
      )}`
    : ""
  const { req, res }: { req: NextApiRequest; res: NextApiResponse } =
    createMocks({
      method: "GET",
      query: { siteId: String(siteId) },
      headers: { cookie },
    })
  await handler(req, res)
  return (res as unknown as { _getRedirectUrl: () => string })._getRedirectUrl()
}

const setupWhitelistedUser = async () => {
  const user = await setupUser({})
  await setUpWhitelist({ email: user.email })
  return user
}

const verifyToken = async (redirectUrl: string) => {
  const url = new URL(redirectUrl)
  expect(`${url.origin}${url.pathname}`).toBe(`${POLYGLOT_URL}/api/sso/isomer`)
  const { payload } = await jwtVerify(
    url.searchParams.get("token")!,
    await importSPKI(publicKeyPem, "ES256"),
    { algorithms: ["ES256"], issuer: "isomer", audience: "polyglot-studio" },
  )
  return payload
}

describe("GET /api/polyglot/sso", () => {
  beforeAll(async () => {
    const { publicKey, privateKey } = await generateKeyPair("ES256", {
      extractable: true,
    })
    publicKeyPem = await exportSPKI(publicKey)
    privateKeyPem = await exportPKCS8(privateKey)
  })

  beforeEach(async () => {
    await resetTables("ResourcePermission", "IsomerAdmin", "Whitelist", "User")
    mockEnv.POLYGLOT_SSO_PRIVATE_KEY = privateKeyPem
    mockEnv.POLYGLOT_STUDIO_URL = POLYGLOT_URL
  })

  it("302s a site Publisher to Polyglot with a valid signed token", async () => {
    const { site } = await setupSite()
    const user = await setupWhitelistedUser()
    await setupPublisherPermissions({ userId: user.id, siteId: site.id })

    const payload = await verifyToken(
      await callRoute({ userId: user.id, siteId: site.id }),
    )

    expect(payload).toMatchObject({ email: user.email, siteId: site.id })
    expect(payload.jti).toEqual(expect.any(String))
    // Polyglot rejects lifetimes over 120s
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(120)
  })

  it("lets an Isomer admin with no site role through", async () => {
    const { site } = await setupSite()
    const user = await setupWhitelistedUser()
    await setupIsomerAdmin({ userId: user.id })

    const payload = await verifyToken(
      await callRoute({ userId: user.id, siteId: site.id }),
    )

    expect(payload.email).toBe(user.email)
  })

  it("falls back to plain Polyglot for an Editor", async () => {
    const { site } = await setupSite()
    const user = await setupWhitelistedUser()
    await setupEditorPermissions({ userId: user.id, siteId: site.id })

    expect(await callRoute({ userId: user.id, siteId: site.id })).toBe(
      POLYGLOT_URL,
    )
  })

  it("falls back to plain Polyglot when SSO isn't configured", async () => {
    mockEnv.POLYGLOT_SSO_PRIVATE_KEY = undefined
    mockEnv.POLYGLOT_STUDIO_URL = undefined
    const { site } = await setupSite()
    const user = await setupWhitelistedUser()
    await setupPublisherPermissions({ userId: user.id, siteId: site.id })

    expect(await callRoute({ userId: user.id, siteId: site.id })).toBe(
      DEFAULT_POLYGLOT_STUDIO_URL,
    )
  })

  // A Studio cookie can outlive the account's access; never vouch for it
  it.each([
    {
      name: "deleted",
      setup: async () => {
        const user = await setupUser({ isDeleted: true })
        await setUpWhitelist({ email: user.email })
        return user
      },
    },
    {
      name: "no longer whitelisted",
      setup: async () => {
        const user = await setupUser({})
        await setUpWhitelist({
          email: user.email,
          expiry: new Date(Date.now() - 60_000),
        })
        return user
      },
    },
  ])(
    "redirects a Publisher whose account is $name to sign-in",
    async ({ setup }) => {
      const { site } = await setupSite()
      const user = await setup()
      await setupPublisherPermissions({ userId: user.id, siteId: site.id })

      expect(await callRoute({ userId: user.id, siteId: site.id })).toBe(
        "/sign-in",
      )
    },
  )

  it("redirects to sign-in without a session", async () => {
    const { site } = await setupSite()

    expect(await callRoute({ siteId: site.id })).toBe("/sign-in")
  })
})
