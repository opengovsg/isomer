import { z } from "zod"

export const sitePageSchema = z.object({
  siteId: z.coerce.number(),
})
