import { z } from "zod"

// Coerces a string to true if it's "true", false if "false".
const coerceBoolean = z
  .string()
  // only allow "true" or "false" or empty string
  .refine((s) => s === "true" || s === "false" || s === "")
  // transform to boolean
  .transform((s) => s === "true")
  // make sure tranform worked
  .pipe(z.boolean())

const s3Schema = z.object({
  NEXT_PUBLIC_S3_REGION: z.string().default("us-east-1"),
  NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME: z.string(),
  NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME: z.string(),
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
    ]),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default("Isomer Studio"),
    NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
    NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),
  })
  .merge(s3Schema)

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
    POSTMAN_API_KEY: z.string().optional(),
    SESSION_SECRET: z.string().min(32),
    GROWTHBOOK_CLIENT_KEY: z.string().optional(),
    WEBHOOK_API_KEY: z.string().optional(),
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number().default(6379),
    SEARCHSG_API_KEY: z.string(),
  })
  .merge(s3Schema)
  .merge(singpassSchema)
  .merge(client)

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
  CI: process.env.CI,
  NODE_ENV: process.env.NODE_ENV,
  OTP_EXPIRY: process.env.OTP_EXPIRY,
  POSTMAN_API_KEY: process.env.POSTMAN_API_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  GROWTHBOOK_CLIENT_KEY: process.env.GROWTHBOOK_CLIENT_KEY,
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
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  WEBHOOK_API_KEY: process.env.WEBHOOK_API_KEY,
  // Client-side env vars
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION:
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY:
    process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY,
  NEXT_PUBLIC_INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,
  SEARCHSG_API_KEY: process.env.SEARCHSG_API_KEY,
}

// Don't touch the part below
// --------------------------
/** @typedef {z.input<typeof server>} MergedInput */
/** @typedef {z.infer<typeof server>} MergedOutput */
/** @typedef {z.SafeParseReturnType<MergedInput, MergedOutput>} MergedSafeParseReturn */

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
