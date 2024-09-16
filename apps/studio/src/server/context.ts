import type * as trpc from "@trpc/server"
import type { CreateNextContextOptions } from "@trpc/server/adapters/next"
import { GrowthBook } from "@growthbook/growthbook"
import { type User } from "@prisma/client"
import { getIronSession } from "iron-session"

import { env } from "~/env.mjs"
import { type Session, type SessionData } from "~/lib/types/session"
import { sessionOptions } from "./modules/auth/session"
import { db } from "./modules/database"
import { type defaultMeSelect } from "./modules/me/me.select"
import { prisma } from "./prisma"

interface CreateContextOptions {
  session?: Session
  user?: Pick<User, keyof typeof defaultMeSelect>
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export function createContextInner(opts: CreateContextOptions) {
  return {
    session: opts.session,
    prisma,
    db,
  }
}

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getIronSession<SessionData>(
    opts.req,
    opts.res,
    sessionOptions,
  )

  const innerContext = createContextInner({
    session,
  })

  const growthbookContext = new GrowthBook({
    apiHost: "https://cdn.growthbook.io",
    clientKey: env.GROWTHBOOK_CLIENT_KEY,
    debug: false, // NOTE: do not put true unless local dev
    disableCache: true,
  })
  await growthbookContext.init({ timeout: 2000 })

  return {
    ...innerContext,
    req: opts.req,
    res: opts.res,
    gb: growthbookContext,
  }
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>
