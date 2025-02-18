import { type User } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import { MOCK_STORY_DATE } from "../constants"
import { trpcMsw } from "../mockTrpc"

export const defaultUser: User = {
  id: "cljcnahpn0000xlwynuea40lv",
  email: "test@example.com",
  name: "Test User",
  phone: "12345678",
  createdAt: MOCK_STORY_DATE,
  updatedAt: MOCK_STORY_DATE,
  deletedAt: null,
  lastLoginAt: null,
}

const defaultMeGetQuery = () => {
  return trpcMsw.me.get.query(() => {
    return defaultUser
  })
}

const unauthorizedMeGetQuery = () => {
  return trpcMsw.me.get.query(() => {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  })
}

export const meHandlers = {
  me: defaultMeGetQuery,
  unauthorized: unauthorizedMeGetQuery,
}
