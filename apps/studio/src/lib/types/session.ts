import type { Tagged } from "type-fest"
import { type User } from "@prisma/client"
import { type IronSession } from "iron-session"
import type { Tagged } from "type-fest"

import type { VerificationToken } from "~/server/modules/database"

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
    }
  }
}

export type Session = IronSession<SessionData>
