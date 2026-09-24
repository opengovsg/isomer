import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

import {
  assertStudioEnvSecurityInvariants,
  readProcessEnv as readStorybookProcessEnv,
} from "./env/guards.mjs"

const SYSTEM_USER_EMAIL = "system@isomer.gov.sg"

const storybookInjectedEnv = process.env.STORYBOOK
  ? JSON.parse(process.env.STORYBOOK_ENVIRONMENT ?? "{}")
  : null

/** @param {string} key */
const readProcessEnv = (key) =>
  readStorybookProcessEnv(key, storybookInjectedEnv, process.env)

const cronWorkersSchema = z.stringbool().optional().default(false)
const skipSingpassSchema = z.stringbool().optional().default(false)

/** @param {unknown} value */
const coerceEnvBoolean = (value, stringSchema) => {
  if (typeof value === "boolean") return value
  return stringSchema.parse(value)
}

const cronWorkersEnvSchema = z.preprocess(
  (value) => coerceEnvBoolean(value, cronWorkersSchema),
  z.boolean().default(false),
)
const skipSingpassEnvSchema = z.preprocess(
  (value) => coerceEnvBoolean(value, skipSingpassSchema),
  z.boolean().default(false),
)

const shouldSkipEnvValidation =
  !!process.env.SKIP_ENV_VALIDATION ||
  process.env.npm_lifecycle_event === "lint" ||
  !!process.env.STORYBOOK

const parsedEnv = createEnv({
  shared: {
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    CI: z.coerce.boolean().default(false),
    ENABLE_CRON_WORKERS: cronWorkersEnvSchema,
    OTP_EXPIRY: z.coerce.number().positive().optional().default(600),
    // WARNING: Setting this bypasses OTP security. For preview environments only — never set in staging or production.
    DANGEROUSLY_SET_STATIC_OTP: z.string().length(6).optional(),
    POSTMAN_API_KEY: z.string().optional(),
    SESSION_SECRET: z.string().min(32),
    GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    STUDIO_SSM_WEBHOOK_API_KEY: z.string().optional(),
    S3_GAZETTE_BUCKET_NAME: z.string(),
    S3_GAZETTE_DOMAIN_NAME: z.string(),
    S3_STUDIO_ASSETS_BUCKET_NAME: z.string().optional(),
    CLOUDFRONT_ASSETS_DISTRIBUTION_ID: z.string().optional(),
    EGAZETTE_DOCUMENT_INDEX: z.string().optional(),
    DD_DELETION_EMAIL: z.email(),
    SEARCHSG_API_KEY: z.string(),
    ALGOLIA_APP_ID: z.string(),
    ALGOLIA_API_KEY: z.string(),
    ALGOLIA_INDEX_NAME: z.string(),
    SYSTEM_USER_EMAIL: z.email().optional().default(SYSTEM_USER_EMAIL),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    SINGPASS_CLIENT_ID: z.string().min(1),
    SINGPASS_ISSUER_ENDPOINT: z.string().url().min(1),
    SINGPASS_REDIRECT_URI: z.string().url().optional(),
    SINGPASS_ENCRYPTION_PRIVATE_KEY: z.string().min(1),
    SINGPASS_ENCRYPTION_KEY_ALG: z.string().min(1).default("ECDH-ES+A256KW"),
    SINGPASS_SIGNING_PRIVATE_KEY: z.string().min(1),
    SINGPASS_SIGNING_KEY_ALG: z.string().min(1).default("ES512"),
    SCHEDULED_PUBLISHING_HEARTBEAT_URL: z.string().url().optional(),
    DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL: z.string().url().optional(),
    SCHEDULE_PUSH_DOCUMENT_JOB_HEARTBEAT_URL: z.string().url().optional(),
  },
  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_ENV: z.enum([
      "development",
      "staging",
      "production",
      "vapt",
      "test",
      "uat",
      "preview",
    ]),
    // WARNING: Setting this bypasses SingPass login entirely. For preview
    // environments only — never set in staging or production.
    NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS: skipSingpassEnvSchema,
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default("Isomer Studio"),
    NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
    NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_ASSETS_HOST: z.string().url().optional(),
    NEXT_PUBLIC_S3_REGION: z.string().default("us-east-1"),
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME: z.string(),
    NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME: z.string(),
  },
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  experimental__runtimeEnv: {
    NODE_ENV: readProcessEnv("NODE_ENV") ?? process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV:
      readProcessEnv("NEXT_PUBLIC_APP_ENV") ??
      (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
        ? "preview"
        : undefined),
    NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS:
      readProcessEnv("NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS") ??
      process.env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS,
    NEXT_PUBLIC_APP_URL:
      readProcessEnv("NEXT_PUBLIC_APP_URL") ?? process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME:
      readProcessEnv("NEXT_PUBLIC_APP_NAME") ??
      process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION:
      readProcessEnv("NEXT_PUBLIC_APP_VERSION") ??
      process.env.NEXT_PUBLIC_APP_VERSION ??
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY:
      readProcessEnv("NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY") ??
      process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
    NEXT_PUBLIC_INTERCOM_APP_ID:
      readProcessEnv("NEXT_PUBLIC_INTERCOM_APP_ID") ??
      process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
    NEXT_PUBLIC_POSTHOG_ASSETS_HOST:
      readProcessEnv("NEXT_PUBLIC_POSTHOG_ASSETS_HOST") ||
      process.env.NEXT_PUBLIC_POSTHOG_ASSETS_HOST ||
      undefined,
    NEXT_PUBLIC_POSTHOG_HOST:
      readProcessEnv("NEXT_PUBLIC_POSTHOG_HOST") ||
      process.env.NEXT_PUBLIC_POSTHOG_HOST ||
      undefined,
    NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
      readProcessEnv("NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN") ||
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ||
      undefined,
    NEXT_PUBLIC_S3_REGION:
      readProcessEnv("NEXT_PUBLIC_S3_REGION") ??
      process.env.NEXT_PUBLIC_S3_REGION,
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME:
      readProcessEnv("NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME") ??
      process.env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
    NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME:
      readProcessEnv("NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME") ??
      process.env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  },
  skipValidation: shouldSkipEnvValidation,
})

export const env = shouldSkipEnvValidation
  ? new Proxy(parsedEnv, {
      get(target, prop, receiver) {
        if (prop === "ENABLE_CRON_WORKERS") {
          return cronWorkersSchema.parse(
            readProcessEnv("ENABLE_CRON_WORKERS") ??
              process.env.ENABLE_CRON_WORKERS,
          )
        }
        if (prop === "NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS") {
          return skipSingpassSchema.parse(
            readProcessEnv("NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS") ??
              process.env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS,
          )
        }
        return Reflect.get(target, prop, receiver)
      },
    })
  : parsedEnv

if (!shouldSkipEnvValidation && typeof window === "undefined") {
  assertStudioEnvSecurityInvariants(env)
}
