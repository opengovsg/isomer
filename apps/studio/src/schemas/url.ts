import { z } from "zod"

import { DASHBOARD } from "~/lib/routes"
import { isRelativeUrl } from "~/utils/url"

export const callbackUrlSchema = z
  .string()
  .optional()
  .default(DASHBOARD)
  .refine((url) => url && isRelativeUrl(url))
  .catch(DASHBOARD)
