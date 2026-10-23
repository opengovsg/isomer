import { z } from "zod"

import { callbackUrlSchema } from "../url"

export const singpassLoginSchema = z.object({
  landingUrl: callbackUrlSchema,
})

export const singpassCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
  // Optional because the legacy flow omits `iss`; FAPI still requires it at token exchange.
  iss: z.string().min(1, { message: "Enter the Singpass issuer" }).optional(),
})
