import type { Tagged } from "type-fest"
import { type User } from "@prisma/client"
import { type IronSession } from "iron-session"

import type { VerificationToken } from "~/server/modules/database"
import { type SgidSessionProfile } from "~/server/modules/auth/sgid/sgid.utils"

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
  sgid?: {
    sessionState?: {
      codeVerifier: string
      nonce?: string
    }
    profiles?: SgidSessionProfile
  }
}

export type Session = IronSession<SessionData>
