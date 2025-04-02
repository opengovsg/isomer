import { z } from "zod"

import { SINGPASS_SIGN_IN_STATE } from "~/server/modules/auth/singpass/singpass.constants"
import { callbackUrlSchema } from "../url"

export const singpassLoginSchema = z.object({
  landingUrl: callbackUrlSchema,
})

export const singpassCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
})

export const singpassStateSchema = z.object({
  state: z.literal(SINGPASS_SIGN_IN_STATE),
})
