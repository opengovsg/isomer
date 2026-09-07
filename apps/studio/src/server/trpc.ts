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
import { timingSafeEqual } from "node:crypto"
import superjson from "superjson"
import { z, ZodError } from "zod"
import { APP_VERSION_HEADER_KEY } from "~/constants/version"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { redactLogInput } from "~/lib/redact-log-input"
import { hasNonEmptyString, isNullableBooleanTrue } from "~/utils/truthiness"

import type { Context } from "./context"
import type { RateLimitMetaOptions } from "./modules/rate-limit/types"
import { db } from "./modules/database/database"
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
     * @see https://trpc.io/docs/v10/error-formatting
     */
    errorFormatter(opts) {
      // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- tRPC error formatter API
      const { shape: procedureError } = opts
      const { error } = opts
      return {
        ...procedureError,
        data: {
          ...procedureError.data,
          zodError:
            error.code === "BAD_REQUEST" && error.cause instanceof ZodError
              ? z.treeifyError(error.cause)
              : null,
        },
      }
    },
    /**
     * @see https://trpc.io/docs/v10/data-transformers
     */
    transformer: superjson,
  })

// Setting outer context with tRPC will not get us correct path during request batching,
// only by setting logger context in the middleware do we get the exact path to log
const loggerMiddleware = t.middleware(
  async ({ path, next, ctx, type, getRawInput }) => {
    const start = Date.now()
    const logger = createBaseLogger({
      path,
      req: ctx.req,
    })
    const unparsedInput: unknown = await getRawInput()
    // SAFETY: procedure inputs are JSON-serializable values at log time.
    const rawInput = redactLogInput(
      unparsedInput as Parameters<typeof redactLogInput>[0],
    )

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

    const clientVersionHeader =
      req.headers[APP_VERSION_HEADER_KEY.toLowerCase()]
    const clientVersion = Array.isArray(clientVersionHeader)
      ? undefined
      : clientVersionHeader

    if (hasNonEmptyString(clientVersion) && serverVersion !== clientVersion) {
      logger.warn(
        {
          clientVersion,
          serverVersion,
        },
        "Application version mismatch",
      )
    } else if (!hasNonEmptyString(clientVersion)) {
      logger.warn(
        {
          serverVersion,
        },
        "Client version not available",
      )
    }

    res.setHeader(APP_VERSION_HEADER_KEY, serverVersion)

    return await next()
  },
)

const contentTypeHeaderMiddleware = t.middleware(async ({ ctx, next }) => {
  if (
    ctx.req.body !== undefined &&
    ctx.req.body !== null &&
    ctx.req.headers["content-type"] !== "application/json"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Content-Type",
    })
  }
  return await next()
})

const baseMiddleware = t.middleware(async ({ ctx, next }) => {
  if (ctx.session === undefined) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
  }
  return await next({
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

  return await next({
    ctx: {
      user,
    },
  })
})

/**
 * Webhook middleware to protect endpoints that do not need a user context
 * but still need to be protected via an API key.
 * */

export const WEBHOOK_X_API_KEY_HEADER = "x-api-key"

const isValidWebhookApiKey = (
  apiKey: string | string[] | undefined,
  expectedApiKey: string,
): boolean => {
  if (Object.prototype.toString.call(apiKey) !== "[object String]") {
    return false
  }
  // SAFETY: [object String] tag confirms a string primitive.
  const key = apiKey as string
  return (
    key.length === expectedApiKey.length &&
    timingSafeEqual(Buffer.from(key), Buffer.from(expectedApiKey))
  )
}

const webhookMiddleware = t.middleware(async ({ next, ctx }) => {
  const apiKey = ctx.req.headers[WEBHOOK_X_API_KEY_HEADER]
  // Ensure that the API key is set in the env
  if (!hasNonEmptyString(env.STUDIO_SSM_WEBHOOK_API_KEY)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Webhook API key is not configured",
    })
  }
  // Ensure that the API key is valid and matches
  if (!isValidWebhookApiKey(apiKey, env.STUDIO_SSM_WEBHOOK_API_KEY)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid Webhook API key provided",
    })
  }
  return await next()
})

// GrowthBook registers each instance in a module-level global Map on init().
// Without destroy(), instances accumulate and are never GC'd.
const growthbookCleanupMiddleware = t.middleware(async ({ ctx, next }) => {
  try {
    return await next()
  } finally {
    ctx.gb?.destroy()
  }
})

const rateLimitMiddleware = t.middleware(async ({ next, ctx, meta }) => {
  if (meta?.rateLimitOptions === undefined) {
    return await next()
  }

  if (
    env.NODE_ENV === "test" &&
    !isNullableBooleanTrue(
      meta.rateLimitOptions._internalUseRateLimiterInTestEnv,
    )
  ) {
    return await next()
  }

  await checkRateLimit({
    prisma: ctx.prisma,
    rateLimitOptions: meta.rateLimitOptions,
    req: ctx.req,
  })

  return await next()
})

/**
 * Create a router
 * @see https://trpc.io/docs/v10/router
 */
export const { router } = t

const baseProcedure = t.procedure
  .use(growthbookCleanupMiddleware)
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
