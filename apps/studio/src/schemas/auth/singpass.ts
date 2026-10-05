import { z } from "zod"

import { callbackUrlSchema } from "../url"

export const singpassLoginSchema = z.object({
  landingUrl: callbackUrlSchema,
})

export const singpassCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
  // RFC 9207 issuer, returned by the FAPI authorization response.
  iss: z.string().url({ message: "Enter a valid Singpass issuer" }).optional(),
})
