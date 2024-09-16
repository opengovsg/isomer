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
    NEXT_PUBLIC_ENABLE_SGID: coerceBoolean.default("false"),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_NAME: z.string().default("Isomer Studio"),
    NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
  })
  .merge(s3Schema)

/** Feature flags */

const baseSgidSchema = z.object({
  SGID_CLIENT_ID: z.string().optional(),
  SGID_CLIENT_SECRET: z.string().optional(),
  // Remember to set SGID redirect URI in SGID dev portal.
  SGID_REDIRECT_URI: z.union([z.string().url(), z.string()]).optional(),
  SGID_PRIVATE_KEY: z.string().optional(),
})

const sgidServerSchema = z.discriminatedUnion("NEXT_PUBLIC_ENABLE_SGID", [
  baseSgidSchema.extend({
    NEXT_PUBLIC_ENABLE_SGID: z.literal(true),
    // Add required keys if flag is enabled.
    SGID_CLIENT_ID: z.string().min(1),
    SGID_CLIENT_SECRET: z.string().min(1),
    SGID_PRIVATE_KEY: z.string().min(1),
    SGID_REDIRECT_URI: z.string().url(),
  }),
  baseSgidSchema.extend({
    NEXT_PUBLIC_ENABLE_SGID: z.literal(false),
  }),
])

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars.
 */
const server = z
  .object({
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(["development", "test", "production"]),
    OTP_EXPIRY: z.coerce.number().positive().optional().default(600),
    POSTMAN_API_KEY: z.string().optional(),
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_FROM_ADDRESS: z.union([
      z.string().email().optional(),
      z.string().length(0),
    ]),
    SESSION_SECRET: z.string().min(32),
    GROWTHBOOK_CLIENT_KEY: z.string().optional(),
  })
  .merge(s3Schema)
  // Add on schemas as needed that requires conditional validation.
  .merge(baseSgidSchema)
  .merge(client)
  // Add on refinements as needed for conditional environment variables
  // .superRefine((val, ctx) => ...)
  .superRefine((val, ctx) => {
    const parse = sgidServerSchema.safeParse(val)
    if (!parse.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXT_PUBLIC_ENABLE_SGID"],
        message: "SGID environment variables are missing",
      })
      parse.error.issues.forEach((issue) => {
        ctx.addIssue(issue)
      })
    }
  })
  .refine((val) => !(val.SENDGRID_API_KEY && !val.SENDGRID_FROM_ADDRESS), {
    message: "SENDGRID_FROM_ADDRESS is required when SENDGRID_API_KEY is set",
    path: ["SENDGRID_FROM_ADDRESS"],
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
  NODE_ENV: process.env.NODE_ENV,
  OTP_EXPIRY: process.env.OTP_EXPIRY,
  POSTMAN_API_KEY: process.env.POSTMAN_API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_ADDRESS: process.env.SENDGRID_FROM_ADDRESS,
  SESSION_SECRET: process.env.SESSION_SECRET,
  GROWTHBOOK_CLIENT_KEY: process.env.GROWTHBOOK_CLIENT_KEY,
  NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
  NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME:
    process.env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME,
  NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME:
    process.env.NEXT_PUBLIC_S3_ASSETS_BUCKET_NAME,
  SGID_CLIENT_ID: process.env.SGID_CLIENT_ID,
  SGID_CLIENT_SECRET: process.env.SGID_CLIENT_SECRET,
  SGID_PRIVATE_KEY: process.env.SGID_PRIVATE_KEY,
  SGID_REDIRECT_URI: process.env.SGID_REDIRECT_URI,
  // Client-side env vars
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_VERSION:
    process.env.NEXT_PUBLIC_APP_VERSION ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  NEXT_PUBLIC_ENABLE_SGID: process.env.NEXT_PUBLIC_ENABLE_SGID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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
