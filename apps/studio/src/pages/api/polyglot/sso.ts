import type { NextApiRequest, NextApiResponse } from "next"
import { getIronSession } from "iron-session"
import { importPKCS8, SignJWT } from "jose"
import { randomUUID } from "node:crypto"
import { z } from "zod"
import {
  DEFAULT_POLYGLOT_STUDIO_URL,
  POLYGLOT_SSO_ROLES,
} from "~/constants/polyglot"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { SIGN_IN } from "~/lib/routes"
import { type SessionData } from "~/lib/types/session"
import { generateSessionOptions } from "~/server/modules/auth/session"
import { db } from "~/server/modules/database"
import { getResourcePermission } from "~/server/modules/permissions/permissions.service"
import { isEmailWhitelisted } from "~/server/modules/whitelist/whitelist.service"

// The sidebar's Polyglot icon links here. We mint a short-lived, single-use
// ES256 token and 302 to Polyglot's `/api/sso/isomer`, which signs the user in
// and lands them on the site (contract: opengovsg/polyglot#287). Minting at
// click time keeps the token out of any rendered page. Whenever SSO can't
// happen (not configured, not allowed, signing failed) we fall back to the
// plain Polyglot Studio link, where the user can still sign in with OTP.

// Polyglot rejects anything over 120s
const TOKEN_LIFETIME_SECS = 60

const querySchema = z.object({ siteId: z.coerce.number().int().positive() })

const logger = createBaseLogger({ path: "api/polyglot/sso" })

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed")
  }

  const polyglotStudioUrl =
    env.POLYGLOT_STUDIO_URL ?? DEFAULT_POLYGLOT_STUDIO_URL
  const fallback = () => res.redirect(302, polyglotStudioUrl)

  const session = await getIronSession<SessionData>(
    req,
    res,
    generateSessionOptions(),
  )
  const userId = session.userId
  if (!userId) {
    return res.redirect(302, SIGN_IN)
  }

  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return fallback()
  }
  const { siteId } = parsed.data

  try {
    // Same gate as protectedProcedure: we're vouching for this user to Polyglot
    const user = await db
      .selectFrom("User")
      .where("id", "=", userId)
      .where("deletedAt", "is", null)
      .select("email")
      .executeTakeFirst()
    if (!user || !(await isEmailWhitelisted(user.email))) {
      return res.redirect(302, SIGN_IN)
    }

    const roles = await getResourcePermission({ userId, siteId })
    if (!roles.some(({ role }) => POLYGLOT_SSO_ROLES.includes(role))) {
      return fallback()
    }

    const privateKey = env.POLYGLOT_SSO_PRIVATE_KEY
    if (!privateKey || !env.POLYGLOT_STUDIO_URL) {
      logger.warn("Polyglot SSO not configured, falling back to plain link")
      return fallback()
    }

    const jti = randomUUID()
    const token = await new SignJWT({ email: user.email, siteId })
      .setProtectedHeader({ alg: "ES256" })
      .setIssuer("isomer")
      .setAudience("polyglot-studio")
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(`${TOKEN_LIFETIME_SECS}s`)
      .sign(await importPKCS8(privateKey, "ES256"))

    const url = new URL("/api/sso/isomer", env.POLYGLOT_STUDIO_URL)
    url.searchParams.set("token", token)
    logger.info({ userId, siteId, jti }, "Redirecting to Polyglot SSO")
    return res.redirect(302, url.href)
  } catch (error) {
    // Never log the token itself — it is a live bearer credential
    logger.error({ error, userId, siteId }, "Failed to start Polyglot SSO")
    return fallback()
  }
}
