import { type User } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import {
  MOCK_STORY_DATE,
  MOCK_TEST_PHONE,
  MOCK_TEST_USER_NAME,
} from "../constants"
import { trpcMsw } from "../mockTrpc"

export const defaultUser: User = {
  id: "cljcnahpn0000xlwynuea40lv",
  email: "test@example.com",
  name: MOCK_TEST_USER_NAME,
  phone: MOCK_TEST_PHONE,
  createdAt: MOCK_STORY_DATE,
  updatedAt: MOCK_STORY_DATE,
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
