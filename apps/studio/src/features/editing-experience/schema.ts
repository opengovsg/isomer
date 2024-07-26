import { z } from "zod"

export const editPageSchema = z.object({
  pageId: z.coerce.number(),
  siteId: z.coerce.number(),
})
