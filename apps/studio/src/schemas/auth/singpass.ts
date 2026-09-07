import { z } from "zod"

import { callbackUrlSchema } from "../url"

export const singpassLoginSchema = z.object({
  landingUrl: callbackUrlSchema,
})

export const singpassCallbackSchema = z.object({
  code: z.string(),
  state: z.string(),
})
