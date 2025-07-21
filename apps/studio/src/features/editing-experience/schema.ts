import { z } from "zod"

export const siteSchema = z.object({
  siteId: z.coerce.string(),
})

export const pageSchema = siteSchema.extend({
  pageId: z.coerce.number(),
})

export const collectionItemSchema = pageSchema
  .extend({
    linkId: z.coerce.number(),
  })
  .partial({ pageId: true, linkId: true })

export const pageOrLinkSchema = siteSchema
  .extend({
    pageId: z.coerce.number().optional(),
    linkId: z.coerce.number().optional(),
  })
  .refine((data) => data.pageId !== undefined || data.linkId !== undefined, {
    message: "At least one of pageId or linkId must be present",
    path: [], // General form error since either field could be the solution
  })
