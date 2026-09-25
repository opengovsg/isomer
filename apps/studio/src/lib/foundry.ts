import { env } from "~/env.mjs"

import { createFoundryClient } from "@isomer/ai"

/**
 * Studio adapter for `@isomer/ai`. Absent when PAIR_FOUNDRY_API_KEY is unset
 * so callers can skip model calls instead of failing at import.
 */
export const foundryClient = env.PAIR_FOUNDRY_API_KEY
  ? createFoundryClient({ apiKey: env.PAIR_FOUNDRY_API_KEY })
  : undefined
