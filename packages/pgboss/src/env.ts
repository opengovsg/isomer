import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

const cronWorkersSchema = z.stringbool().optional().default(false)
const cronWorkersEnvSchema = z.preprocess((value) => {
  if (typeof value === "boolean") return value
  return cronWorkersSchema.parse(value)
}, z.boolean().default(false))

const skipValidation =
  !!process.env.SKIP_ENV_VALIDATION ||
  process.env.npm_lifecycle_event === "lint"

const parsedEnv = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    ENABLE_CRON_WORKERS: cronWorkersEnvSchema,
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    ENABLE_CRON_WORKERS: process.env.ENABLE_CRON_WORKERS,
  },
  skipValidation,
})

export const env = skipValidation
  ? new Proxy(parsedEnv, {
      get(target, prop, receiver) {
        if (prop === "ENABLE_CRON_WORKERS") {
          const enabled: boolean = cronWorkersSchema.parse(
            process.env.ENABLE_CRON_WORKERS,
          )
          return enabled
        }
        return Reflect.get(target, prop, receiver) as typeof target
      },
    })
  : parsedEnv
