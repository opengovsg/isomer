import { z } from "zod"

export const siteSchema = z.object({
  siteId: z.coerce.string(),
})

export const pageSchema = z.object({
  pageId: z.coerce.number(),
  siteId: z.coerce.number(),
})

export const collectionItemSchema = pageSchema
  .extend({
    linkId: z.coerce.number(),
  })
  .partial({ linkId: true, pageId: true })

export const pageOrLinkSchema = z.object({
  linkId: z.coerce.number().optional(),
  pageId: z.coerce.number().optional(),
  siteId: z.coerce.number(),
})
