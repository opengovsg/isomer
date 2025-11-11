import { z } from "zod"

export const siteSchema = z.object({
  siteId: z.coerce.string(),
})

export const pageSchema = z.object({
  siteId: z.coerce.number(),
  pageId: z.coerce.number(),
})

export const collectionItemSchema = pageSchema
  .extend({
    linkId: z.coerce.number(),
  })
  .partial({ pageId: true, linkId: true })

export const pageOrLinkSchema = z.object({
  siteId: z.coerce.number(),
  pageId: z.coerce.number().optional(),
  linkId: z.coerce.number().optional(),
})
