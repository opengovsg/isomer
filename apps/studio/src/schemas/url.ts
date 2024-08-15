import { UrlValidator } from "@opengovsg/starter-kitty-validators"
import { z } from "zod"

import { DASHBOARD } from "~/lib/routes"
import { getBaseUrl } from "~/utils/getBaseUrl"

const baseUrl = getBaseUrl()

const validator = new UrlValidator({
  baseOrigin: new URL(baseUrl).origin,
  whitelist: {
    protocols: ["http", "https"],
    hosts: [new URL(baseUrl).host],
  },
})

export const callbackUrlSchema = z
  .string()
  .optional()
  .default(DASHBOARD)
  .transform((url, ctx) => {
    try {
      return validator.parse(url)
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: (error as Error).message,
      })
      return z.NEVER
    }
  })
  .catch(new URL(DASHBOARD, baseUrl))
