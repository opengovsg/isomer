import type { PrismaClient } from "@prisma/client"
import { type NextApiRequest } from "next"
import { TRPCError } from "@trpc/server"
import {
  RateLimiterMemory,
  RateLimiterPrisma,
  RateLimiterRes,
} from "rate-limiter-flexible"

import { type RateLimitMetaOptions } from "./types"
import { getRateLimitFingerprint } from "./utils"

// Default 5 queries per second fallback
export const rateLimiterMemory = new RateLimiterMemory({
  points: 5,
  duration: 1,
})

export async function checkRateLimit({
  rateLimitOptions,
  req,
  prisma,
}: {
  rateLimitOptions: RateLimitMetaOptions
  req: NextApiRequest
  prisma: PrismaClient
}) {
  const max = rateLimitOptions.max ?? 5
  const windowMs = rateLimitOptions.windowMs ?? 1000

  const store = new RateLimiterPrisma({
    storeClient: prisma,
    points: max,
    duration: windowMs / 1000, // in seconds
    insuranceLimiter: rateLimiterMemory,
  })

  const fingerprint = getRateLimitFingerprint({ type: "IP", req })

  try {
    await store.consume(fingerprint)
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      const tryAgainPeriodInSeconds = Math.round(error.msBeforeNext / 1000) || 1

      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many requests, please try again in ${tryAgainPeriodInSeconds}s`,
      })
    }
  }
}
