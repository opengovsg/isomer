import { z } from "zod"

export const editLinkPageSchema = z.object({
  linkId: z.coerce.number().min(1),
  siteId: z.coerce.number().min(1),
})
