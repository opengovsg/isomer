import type { Tagged } from "type-fest"
import type { VerificationToken } from "~/server/modules/database"
import { type IronSession } from "iron-session"
import { type User } from "~prisma/generated/prisma/client"

// Tagged type that represents the current logged in user's ID
type CurrentUserId = Tagged<User["id"], "CurrentUserId">
// Tagged type that represents a potential user ID in the midst of authentication
type PotentialUserId = Tagged<User["id"], "PotentialUserId">

export interface SessionData {
  userId?: CurrentUserId
  singpass?: {
    sessionState?: {
      userId: PotentialUserId
      verificationToken: VerificationToken
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
