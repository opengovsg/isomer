import type * as trpc from "@trpc/server"
import type { CreateNextContextOptions } from "@trpc/server/adapters/next"
import { GrowthBook } from "@growthbook/growthbook"
import { type User } from "@prisma/client"
import { getIronSession } from "iron-session"

import { env } from "~/env.mjs"
import { isSingpassEnabled } from "~/lib/growthbook"
import { type Session, type SessionData } from "~/lib/types/session"
import { generateSessionOptions } from "./modules/auth/session"
import { db } from "./modules/database"
import { type defaultUserSelect } from "./modules/me/me.select"
import { prisma } from "./prisma"

interface CreateContextOptions {
  session?: Session
  user?: Pick<User, (typeof defaultUserSelect)[number]>
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
  const growthbookContext = new GrowthBook({
    apiHost: "https://cdn.growthbook.io",
    clientKey: env.GROWTHBOOK_CLIENT_KEY,
    debug: false, // NOTE: do not put true unless local dev
    disableCache: true,
  })
  await growthbookContext.init({ timeout: 2000 })

  // Added security measure to limit session TTL to 1 hour when Singpass is disabled
  const sessionOptions = isSingpassEnabled({ gb: growthbookContext })
    ? generateSessionOptions({ ttlInHours: 12 })
    : generateSessionOptions({ ttlInHours: 1 })

  const session = await getIronSession<SessionData>(
    opts.req,
    opts.res,
    sessionOptions,
  )

  const innerContext = createContextInner({
    session,
  })

  return {
    ...innerContext,
    req: opts.req,
    res: opts.res,
    gb: growthbookContext,
  }
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>
