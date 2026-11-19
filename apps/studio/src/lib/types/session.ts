import type { Tagged } from "type-fest"
import { type IronSession } from "iron-session"
import { type User } from "~prisma/generated/prisma/client"

// Tagged type that represents the current logged in user's ID
type CurrentUserId = Tagged<User["id"], "CurrentUserId">
// Tagged type that represents a potential user ID in the midst of authentication
type PotentialUserId = Tagged<User["id"], "PotentialUserId">

// iron-session v9 rejects Date objects at seal time; store timestamps instead.
export interface SessionVerificationToken {
  identifier: string
  token: string
  attempts: number
  expires: number
}

export const ONE_GOV_SG_LOGIN_METHOD = "one.gov.sg"

// Stands in for the OTP token when the first factor was one.gov.sg.
// A type alias, not an interface, so it fits the audit log's JSON delta column.
// oxlint-disable-next-line typescript/consistent-type-definitions
export type OneGovSgLoginAttempt = {
  identifier: `${string}|${string}`
  method: typeof ONE_GOV_SG_LOGIN_METHOD
}

export interface SessionData {
  userId?: CurrentUserId
  oneGovSg?: {
    sessionState?: {
      codeVerifier: string
      nonce: string
      state: string
      expiresAt: number
    }
  }
  singpass?: {
    sessionState?: {
      userId: PotentialUserId
      verificationToken: SessionVerificationToken | OneGovSgLoginAttempt
      codeVerifier: string
      nonce?: string
      state?: string
      // Pinned when the authorization request is built. The callback must not
      // re-read the GrowthBook flag: a mid-login change would exchange a FAPI
      // authorization code against the legacy token endpoint.
      useFapi?: boolean
      dpopPrivateJwk?: string
    }
  }
}

export type Session = IronSession<SessionData>
