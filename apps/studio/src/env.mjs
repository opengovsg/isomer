import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
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
    OTP_EXPIRY: z.coerce.number().positive().optional().default(600),
    POSTMAN_API_KEY: z.string().optional(),
    SESSION_SECRET: z.string().min(32),
    GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    STUDIO_SSM_WEBHOOK_API_KEY: z.string().optional(),
    SEARCHSG_API_KEY: z.string(),
    SCHEDULED_PUBLISHING_HEARTBEAT_URL: z.string().url().optional(),
    DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL: z.string().url().optional(),
    SINGPASS_CLIENT_ID: z.string().min(1),
    SINGPASS_ISSUER_ENDPOINT: z.string().url().min(1),
    SINGPASS_REDIRECT_URI: z.string().url().optional(),
    SINGPASS_ENCRYPTION_PRIVATE_KEY: z.string().min(1),
    SINGPASS_ENCRYPTION_KEY_ALG: z.string().min(1).default("ECDH-ES+A256KW"),
    SINGPASS_SIGNING_PRIVATE_KEY: z.string().min(1),
    SINGPASS_SIGNING_KEY_ALG: z.string().min(1).default("ES512"),
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
    ]),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default("Isomer Studio"),
    NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
    NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),
    NEXT_PUBLIC_S3_REGION: z.string().default("us-east-1"),
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME: z.string(),
    NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME: z.string(),
  },
  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION:
      process.env.NEXT_PUBLIC_APP_VERSION ??
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY:
      process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
    NEXT_PUBLIC_INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
    NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
    NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME:
      process.env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
    NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME:
      process.env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint" ||
    !!process.env.STORYBOOK,
})
