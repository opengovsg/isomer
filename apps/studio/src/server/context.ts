import type { CreateNextContextOptions } from "@trpc/server/adapters/next"
import type { Session, SessionData } from "~/lib/types/session"
import type { User } from "~prisma/generated/prisma/client"
import { GrowthBook } from "@growthbook/growthbook"
import { getIronSession } from "iron-session"
import { env } from "~/env.mjs"

import type { defaultUserSelect } from "./modules/me/me.select"
import { generateSessionOptions } from "./modules/auth/session"
import { db } from "./modules/database/database"
import { prisma } from "./prisma"

interface CreateContextOptions {
  session?: Session
  user?: Pick<User, (typeof defaultUserSelect)[number]>
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
export const createContextInner = (opts: CreateContextOptions) => ({
  db,
  prisma,
  session: opts.session,
})

export const createGrowthBookContext = async () => {
  const growthbookContext = new GrowthBook({
    apiHost: "https://cdn.growthbook.io",
    clientKey: env.GROWTHBOOK_CLIENT_KEY,
    debug: false,
    // NOTE: do not put true unless local dev
    disableCache: true,
  })
  await growthbookContext.init({ timeout: 2000 })
  return growthbookContext
}

/**
 * Creates context for an incoming request
 * @see https://trpc.io/docs/context
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  const session = await getIronSession<SessionData>(
    opts.req,
    opts.res,
    generateSessionOptions({ ttlInHours: 1 }),
    // Note: this wouldn't overwrite the cookie (e.g. TTL) if it already exists
  )

  const innerContext = createContextInner({
    session,
  })

  return {
    ...innerContext,
    gb: await createGrowthBookContext(),
    req: opts.req,
    res: opts.res,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
