import { z } from "zod"

const schema = z.object({
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "staging", "production", "test", "vapt", "uat"])
    .default("development"),
  NEXT_PUBLIC_APP_VERSION: z.string().default("0.0.0"),
})

const skipValidation =
  !!process.env.SKIP_ENV_VALIDATION ||
  process.env.npm_lifecycle_event === "lint"

export const env = skipValidation
  ? schema.parse({})
  : schema.parse({
      NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
      NEXT_PUBLIC_APP_VERSION:
        process.env.NEXT_PUBLIC_APP_VERSION ??
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    })
