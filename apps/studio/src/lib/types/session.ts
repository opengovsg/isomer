import type { Tagged } from "type-fest"
import { type User } from "@prisma/client"
import { type IronSession } from "iron-session"

import type { VerificationToken } from "~/server/modules/database"

type CurrentUserId = Tagged<User["id"], "CurrentUserId">

export interface SessionData {
  userId?: CurrentUserId
  singpass?: {
    sessionState?: {
      userId: CurrentUserId
      verificationToken: VerificationToken
      codeVerifier: string
      nonce?: string
    }
  }
}

export type Session = IronSession<SessionData>
