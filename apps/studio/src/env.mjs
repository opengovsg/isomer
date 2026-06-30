import { z } from "zod"

const s3Schema = z.object({
  NEXT_PUBLIC_S3_REGION: z.string().default("us-east-1"),
  NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME: z.string().optional(),
  NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME: z.string().optional(),
})

const cronHeartbeatSchema = z.object({
  SCHEDULED_PUBLISHING_HEARTBEAT_URL: z.string().url().optional(),
  DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL: z.string().url().optional(),
  SCHEDULE_PUSH_DOCUMENT_JOB_HEARTBEAT_URL: z.string().url().optional(),
})

/**
 * Specify your client-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars. To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
const client = z
  .object({
    NEXT_PUBLIC_APP_ENV: z.enum([
      "development",
      "staging",
      "production",
      "vapt",
      "test",
      "uat",
      "preview",
    ]),
    NEXT_PUBLIC_STORAGE_PROVIDER: z.enum(["vercel-blob", "s3"]),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default("Isomer Studio"),
    NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
    NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),
  })
  .merge(s3Schema)
  .merge(cronHeartbeatSchema)

const singpassSchema = z.object({
  SINGPASS_CLIENT_ID: z.string().min(1),
  SINGPASS_ISSUER_ENDPOINT: z.string().url().min(1),
  SINGPASS_REDIRECT_URI: z.string().url().optional(),
  SINGPASS_ENCRYPTION_PRIVATE_KEY: z.string().min(1),
  SINGPASS_ENCRYPTION_KEY_ALG: z.string().min(1).default("ECDH-ES+A256KW"),
  SINGPASS_SIGNING_PRIVATE_KEY: z.string().min(1),
  SINGPASS_SIGNING_KEY_ALG: z.string().min(1).default("ES512"),
})

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars.
 */
const server = z
  .object({
    DATABASE_URL: z.string().url(),
    CI: z.coerce.boolean().default(false),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OTP_EXPIRY: z.coerce.number().positive().optional().default(600),
    // WARNING: Setting this bypasses OTP security. For preview environments only — never set in staging or production.
    DANGEROUSLY_SET_STATIC_OTP: z.string().length(6).optional(),
    POSTMAN_API_KEY: z.string().optional(),
    SESSION_SECRET: z.string().min(32),
    GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    STUDIO_SSM_WEBHOOK_API_KEY: z.string().optional(),
    S3_GAZETTE_BUCKET_NAME: z.string(),
    S3_GAZETTE_DOMAIN_NAME: z.string(),
    EGAZETTE_DOCUMENT_INDEX: z.string().optional(),
    DD_DELETION_EMAIL: z.email(),
    SEARCHSG_API_KEY: z.string(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    ALGOLIA_APP_ID: z.string(),
    ALGOLIA_API_KEY: z.string(),
    ALGOLIA_INDEX_NAME: z.string(),
  })
  .merge(s3Schema)
  .merge(singpassSchema)
  .merge(client)
  .superRefine((data, ctx) => {
    if (data.NEXT_PUBLIC_STORAGE_PROVIDER === "s3") {
      if (!data.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for non-preview environments",
          path: ["NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME"],
        })
      }
      if (!data.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required for non-preview environments",
          path: ["NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME"],
        })
      }
    }
    if (data.NEXT_PUBLIC_STORAGE_PROVIDER === "vercel-blob") {
      if (!data.BLOB_READ_WRITE_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Required when storage provider is vercel-blob",
          path: ["BLOB_READ_WRITE_TOKEN"],
        })
      }
    }
    // Static OTP bypasses OTP security entirely, so structurally forbid it
    // outside preview — a boot-time failure, not an operational assumption.
    if (data.NEXT_PUBLIC_APP_ENV !== "preview") {
      if (data.DANGEROUSLY_SET_STATIC_OTP) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "DANGEROUSLY_SET_STATIC_OTP may only be set in preview environments",
          path: ["DANGEROUSLY_SET_STATIC_OTP"],
        })
      }
    }
  })

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct manually.
 * Intellisense should work due to inference.
 *
 * @type {Record<keyof z.infer<typeof server> | keyof z.infer<typeof client>, string | undefined>}
 */
const processEnv = {
  // Server-side env vars
  DATABASE_URL: process.env.DATABASE_URL,
  DD_DELETION_EMAIL: process.env.DD_DELETION_EMAIL,
  CI: process.env.CI,
  NODE_ENV: process.env.NODE_ENV,
  OTP_EXPIRY: process.env.OTP_EXPIRY,
  POSTMAN_API_KEY: process.env.POSTMAN_API_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  GROWTHBOOK_CLIENT_KEY: process.env.GROWTHBOOK_CLIENT_KEY,
  EGAZETTE_DOCUMENT_INDEX: process.env.EGAZETTE_DOCUMENT_INDEX,
  S3_GAZETTE_BUCKET_NAME: process.env.S3_GAZETTE_BUCKET_NAME,
  S3_GAZETTE_DOMAIN_NAME: process.env.S3_GAZETTE_DOMAIN_NAME,
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
  ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
  ALGOLIA_INDEX_NAME: process.env.ALGOLIA_INDEX_NAME,
  NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
  NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME:
    process.env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
  NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME:
    process.env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  SINGPASS_CLIENT_ID: process.env.SINGPASS_CLIENT_ID,
  SINGPASS_ISSUER_ENDPOINT: process.env.SINGPASS_ISSUER_ENDPOINT,
  SINGPASS_REDIRECT_URI: process.env.SINGPASS_REDIRECT_URI,
  SINGPASS_ENCRYPTION_PRIVATE_KEY: process.env.SINGPASS_ENCRYPTION_PRIVATE_KEY,
  SINGPASS_ENCRYPTION_KEY_ALG: process.env.SINGPASS_ENCRYPTION_KEY_ALG,
  SINGPASS_SIGNING_PRIVATE_KEY: process.env.SINGPASS_SIGNING_PRIVATE_KEY,
  SINGPASS_SIGNING_KEY_ALG: process.env.SINGPASS_SIGNING_KEY_ALG,
  STUDIO_SSM_WEBHOOK_API_KEY: process.env.STUDIO_SSM_WEBHOOK_API_KEY,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  DANGEROUSLY_SET_STATIC_OTP: process.env.DANGEROUSLY_SET_STATIC_OTP,
  // Client-side env vars
  NEXT_PUBLIC_APP_ENV:
    process.env.NEXT_PUBLIC_APP_ENV ??
    (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ? "preview" : undefined),
  NEXT_PUBLIC_STORAGE_PROVIDER: process.env.NEXT_PUBLIC_STORAGE_PROVIDER,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION:
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY:
    process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  NEXT_PUBLIC_INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
  SEARCHSG_API_KEY: process.env.SEARCHSG_API_KEY,
  SCHEDULED_PUBLISHING_HEARTBEAT_URL:
    process.env.SCHEDULED_PUBLISHING_HEARTBEAT_URL,
  DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL:
    process.env.DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL,
  SCHEDULE_PUSH_DOCUMENT_JOB_HEARTBEAT_URL:
    process.env.SCHEDULE_PUSH_DOCUMENT_JOB_HEARTBEAT_URL,
}

// Don't touch the part below
// --------------------------
/** @typedef {z.input<typeof server>} MergedInput */
/** @typedef {z.infer<typeof server>} MergedOutput */
/** @typedef {z.ZodSafeParseResult<MergedOutput>} MergedSafeParseReturn */

// @ts-expect-error Types are wonky from refinement
let env = /** @type {MergedOutput} */ (process.env)

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const isServer = typeof window === "undefined"

  const parsed = /** @type {MergedSafeParseReturn} */ (
    isServer
      ? server.safeParse(processEnv) // on server we can validate all env vars
      : client.safeParse(processEnv) // on client we can only validate the ones that are exposed
  )

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    )
    throw new Error("Invalid environment variables")
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          process.env.NODE_ENV === "production"
            ? "❌ Attempted to access a server-side environment variable on the client"
            : `❌ Attempted to access server-side environment variable '${prop}' on the client`,
        )
      return target[/** @type {keyof typeof target} */ (prop)]
    },
  })
} else if (process.env.STORYBOOK) {
  const parsed = client
    .partial()
    .safeParse(JSON.parse(process.env.STORYBOOK_ENVIRONMENT ?? "{}"))
  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    )
    throw new Error("Invalid environment variables")
  }
  // @ts-expect-error Injection of environment variables is optional
  env = parsed.data
}

export { env }
