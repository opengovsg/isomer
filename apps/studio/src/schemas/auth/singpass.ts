import { z } from "zod"

import { callbackUrlSchema } from "../url"

export const singpassLoginSchema = z.object({
  landingUrl: callbackUrlSchema,
})

export const singpassCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
  // Singpass sends `iss` on the FAPI redirect. Optional so a missing value
  // fails in token exchange, where the failure is logged.
  iss: z.string().min(1, { message: "Enter the Singpass issuer" }).optional(),
})
