import { z } from "zod"

// TODO: This package duplicates the NEXT_PUBLIC_APP_ENV / NEXT_PUBLIC_APP_VERSION
// validation that already lives in apps/studio/src/env.mjs and quietly couples
// this "shared" package to Next.js conventions:
//   - A non-Next.js consumer (standalone worker, CLI) wont set NEXT_PUBLIC_*
//     and the tracer will silently fall back to "development" / "0.0.0".
//   - The skipValidation heuristic (npm_lifecycle_event === "lint") is brittle.
// Follow-up: change initTracer to accept env/version as arguments from the
// caller (which already validates env via ~/env.mjs) and delete this file.
// This PR is a pure port of the existing logger out of apps/studio; the
// refactor is intentionally deferred to keep the diff minimal.
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
