import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const env = createEnv({
  server: {
    SEARCHSG_API_KEY: z.string().min(1, "SEARCHSG_API_KEY is required"),
    GITHUB_TOKEN: z
      .string()
      .min(1, "GITHUB_TOKEN is required")
      .startsWith("ghp_"),
    PUBLISHER_USER_ID: z.string().min(1, "PUBLISHER_USER_ID is required"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    S3_BUCKET_URI: z
      .string()
      .min(1, "S3_BUCKET_URI is required")
      .startsWith("s3://"),
    AWS_PROFILE: z.string().min(1, "AWS_PROFILE is required"),
  },
  runtimeEnv: process.env,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === "lint",
})
