import type { NextApiRequest } from "next"
import type { PrismaClient } from "~prisma/generated/prisma/client"
import { TRPCError } from "@trpc/server"
import {
  RateLimiterMemory,
  RateLimiterPrisma,
  RateLimiterRes,
} from "rate-limiter-flexible"

import type { RateLimitMetaOptions } from "./types"
import { getRateLimitFingerprint } from "./utils"

// Default 5 queries per second fallback
const rateLimiterMemory = new RateLimiterMemory({
  duration: 1,
  points: 5,
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
    duration: windowMs / 1000,
    // in seconds
    insuranceLimiter: rateLimiterMemory,
    points: max,
    storeClient: prisma,
  })

  const fingerprint = getRateLimitFingerprint(req)

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
