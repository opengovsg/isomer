import { z } from "zod"

export const editPageSchema = z.object({
  pageId: z.coerce.number(),
  siteId: z.coerce.number(),
})

export const collectionItemSchema = editPageSchema
  .extend({
    linkId: z.coerce.number(),
  })
  .partial({ pageId: true, linkId: true })
