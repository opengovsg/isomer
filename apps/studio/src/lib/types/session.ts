import { type User } from "@prisma/client"
import { type IronSession } from "iron-session"
import { Tagged } from "type-fest"

import { type SgidSessionProfile } from "~/server/modules/auth/sgid/sgid.utils"

type CurrentUserId = Tagged<User["id"], "CurrentUserId">

export interface SessionData {
  userId?: CurrentUserId
  sgid?: {
    sessionState?: {
      codeVerifier: string
      nonce?: string
    }
    profiles?: SgidSessionProfile
  }
}

export type Session = IronSession<SessionData>
