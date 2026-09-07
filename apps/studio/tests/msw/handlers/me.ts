import { TRPCError } from "@trpc/server"
import type { User } from "~prisma/generated/prisma/client"

import {
  MOCK_STORY_DATE,
  MOCK_TEST_PHONE,
  MOCK_TEST_USER_NAME,
  MOCK_TEST_UUID,
} from "../constants"
import { trpcMsw } from "../mockTrpc"

export const defaultUser: User = {
  createdAt: MOCK_STORY_DATE,
  deletedAt: null,
  email: "test@example.com",
  id: "cljcnahpn0000xlwynuea40lv",
  lastLoginAt: null,
  name: MOCK_TEST_USER_NAME,
  phone: MOCK_TEST_PHONE,
  singpassUuid: MOCK_TEST_UUID,
  updatedAt: MOCK_STORY_DATE,
}

const defaultMeGetQuery = () => 
  trpcMsw.me.get.query(() => {
    return defaultUser
  })


const notOnboardedMeGetQuery = () => 
  trpcMsw.me.get.query(() => {
    return {
      ...defaultUser,
      name: "",
      phone: "",
    }
  })


const unauthorizedMeGetQuery = () => 
  trpcMsw.me.get.query(() => {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  })


export const meHandlers = {
  me: defaultMeGetQuery,
  notOnboarded: notOnboardedMeGetQuery,
  unauthorized: unauthorizedMeGetQuery,
}
