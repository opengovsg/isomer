import { env } from "~/env.mjs"

import { createPairFoundryClient } from "@isomer/ai"

/**
 * Studio adapter for `@isomer/ai`. Absent when PAIR_FOUNDRY_API_KEY is unset
 * so callers can skip model calls instead of failing at import.
 */
export const pairFoundryClient = env.PAIR_FOUNDRY_API_KEY
  ? createPairFoundryClient({ apiKey: env.PAIR_FOUNDRY_API_KEY })
  : undefined
