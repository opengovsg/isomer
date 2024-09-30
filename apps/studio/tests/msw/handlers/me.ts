import { TRPCError } from "@trpc/server"

import type { User } from "~server/db"
import { trpcMsw } from "../mockTrpc"

export const defaultUser: User = {
  id: "cljcnahpn0000xlwynuea40lv",
  email: "test@example.com",
  name: "Test User",
  phone: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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
