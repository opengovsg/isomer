import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ENABLE_CRON_WORKERS: z.stringbool().optional().default(false),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
})

export const env = envSchema.parse(process.env)
