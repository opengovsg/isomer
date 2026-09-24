import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const cronWorkersSchema = z.stringbool().optional().default(false)

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ENABLE_CRON_WORKERS: cronWorkersSchema,
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Parsed here so "false" stays false when skipValidation bypasses the schema.
    ENABLE_CRON_WORKERS: cronWorkersSchema.parse(
      process.env.ENABLE_CRON_WORKERS,
    ),
  },
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
})
