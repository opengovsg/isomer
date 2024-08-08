import { z } from "zod"

export const getResourceSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.number().min(1),
})
