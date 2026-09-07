import { UrlValidator } from "@opengovsg/validators"
import { z } from "zod"
import { DASHBOARD } from "~/lib/routes"
import { getBaseUrl } from "~/utils/getBaseUrl"

const baseUrl = getBaseUrl()

const validator = new UrlValidator({
  baseOrigin: new URL(baseUrl).origin,
  whitelist: {
    hosts: [new URL(baseUrl).host],
    protocols: ["http", "https"],
  },
})

export const callbackUrlSchema = z
  .string()
  .optional()
  .default(DASHBOARD)
  .transform((url) => {
    try {
      return validator.parse(url)
    } catch {
      return new URL(DASHBOARD, baseUrl)
    }
  })
