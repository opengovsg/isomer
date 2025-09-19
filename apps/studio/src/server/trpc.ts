/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */

import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"

import type { RateLimitMetaOptions } from "./modules/rate-limit/types"
import { APP_VERSION_HEADER_KEY } from "~/constants/version"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import getIP from "~/utils/getClientIp"
import { type Context } from "./context"
import { db } from "./modules/database"
import { defaultUserSelect } from "./modules/me/me.select"
import { checkRateLimit } from "./modules/rate-limit/rate-limit.service"
import { isEmailWhitelisted } from "./modules/whitelist/whitelist.service"

interface Meta {
  rateLimitOptions?: RateLimitMetaOptions
}

const t = initTRPC
  .context<Context>()
  .meta<Meta>()
  .create({
    /**
     * @see https://trpc.io/docs/v10/data-transformers
     */
    transformer: superjson,
    /**
     * @see https://trpc.io/docs/v10/error-formatting
     */
    errorFormatter({ shape, error }) {
      return {
        ...shape,
        data: {
          ...shape.data,
          zodError:
            error.code === "BAD_REQUEST" && error.cause instanceof ZodError
              ? error.cause.flatten()
              : null,
        },
      }
    },
  })

// Setting outer context with tRPC will not get us correct path during request batching,
// only by setting logger context in the middleware do we get the exact path to log
const loggerMiddleware = t.middleware(
  async ({ path, next, ctx, type, getRawInput }) => {
    const start = Date.now()
    const logger = createBaseLogger({ path, clientIp: getIP(ctx.req) })
    const rawInput = await getRawInput()

    const result = await next({
      ctx: { logger },
    })

    const durationInMs = Date.now() - start

    if (result.ok) {
      logger.info(
        { durationInMs, rawInput, userId: ctx.session?.userId },
        `[${type}]: ${path} - ${durationInMs}ms - OK`,
      )
    } else {
      logger.error(
        {
          durationInMs,
          err: result.error,
          rawInput,
          userId: ctx.session?.userId,
        },
        `[${type}]: ${path} - ${durationInMs}ms - ${result.error.code} ${result.error.message} - ERROR`,
      )
    }

    return result
  },
)

const loggerWithVersionMiddleware = loggerMiddleware.unstable_pipe(
  async ({ next, ctx }) => {
    const { req, res, logger } = ctx

    const serverVersion = env.NEXT_PUBLIC_APP_VERSION
    const clientVersion = req.headers[APP_VERSION_HEADER_KEY.toLowerCase()]

    if (clientVersion && serverVersion !== clientVersion) {
      logger.warn("Application version mismatch", {
        clientVersion,
        serverVersion,
      })
    } else if (!clientVersion) {
      logger.warn("Client version not available", {
        serverVersion,
      })
    }

    res.setHeader(APP_VERSION_HEADER_KEY, serverVersion)

    return next()
  },
)

const contentTypeHeaderMiddleware = t.middleware(async ({ ctx, next }) => {
  if (ctx.req.body && ctx.req.headers["content-type"] !== "application/json") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Content-Type",
    })
  }
  return next()
})

const baseMiddleware = t.middleware(async ({ ctx, next }) => {
  if (ctx.session === undefined) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  })
})

const authMiddleware = t.middleware(async ({ next, ctx }) => {
  if (!ctx.session?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // with addition of soft deletes, we need to now check for deletedAt
  // this check is required in case of an already ongoing session to logout the user
  const user = await db
    .selectFrom("User")
    .select(defaultUserSelect)
    .where("id", "=", ctx.session.userId)
    .where("deletedAt", "is", null)
    .executeTakeFirst()

  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  // Ensure that the user is whitelisted to use the app
  const isWhitelisted = await isEmailWhitelisted(user.email)
  if (!isWhitelisted) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }

  return next({
    ctx: {
      user,
    },
  })
})

/**
 * Webhook middleware to protect endpoints that do not need a user context
 * but still need to be protected via an API key. We still check the session
 * in case the request is made by a logged in user (via the FE), and to allow for easier testing.
 * */
const webhookMiddleware = t.middleware(async ({ next, ctx }) => {
  if (!ctx.session?.userId) {
    const apiKey = ctx.req.headers["x-api-key"]
    // Ensure that the API key is set in the env
    if (!env.WEBHOOK_API_KEY) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Webhook API key is not configured",
      })
    }
    // Ensure that the API key is valid and matches
    if (!apiKey || apiKey !== env.WEBHOOK_API_KEY) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Webhook API key provided",
      })
    }
  }
  return next()
})

const rateLimitMiddleware = t.middleware(async ({ next, ctx, meta }) => {
  if (meta?.rateLimitOptions === undefined) {
    return next()
  }

  if (
    env.NODE_ENV === "test" &&
    !meta.rateLimitOptions._internalUseRateLimiterInTestEnv
  ) {
    return next()
  }

  await checkRateLimit({
    req: ctx.req,
    rateLimitOptions: meta.rateLimitOptions,
    prisma: ctx.prisma,
  })

  return next()
})

/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
export const router = t.router

const baseProcedure = t.procedure
  .use(loggerWithVersionMiddleware)
  .use(contentTypeHeaderMiddleware)
  .use(rateLimitMiddleware)

/**
 * Create an unprotected procedure
 * @see https://trpc.io/docs/v10/procedures
 * */
export const publicProcedure = baseProcedure.use(baseMiddleware)

/**
 * Create a protected procedure
 * */
export const protectedProcedure = baseProcedure.use(authMiddleware)

/**
 * Create a webhook procedure - for endpoint that do not need a user context
 * but still need to be protected via an API key
 * e.g. CodeBuild webhook
 * */
export const webhookProcedure = baseProcedure.use(webhookMiddleware)

/**
 * @see https://trpc.io/docs/v10/middlewares
 */
export const { middleware } = t

/**
 * @see https://trpc.io/docs/v10/merging-routers
 */
export const { mergeRouters } = t

export const { createCallerFactory } = t
