import { ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"

const NEW_PAGE_LAYOUT_VALUES = [
  "article",
  "content",
] as const satisfies readonly PrismaJson.BlobJsonContent["layout"][]

export const MAX_TITLE_LENGTH = 150
export const MAX_PAGE_URL_LENGTH = 250

export const pageTitleSchema = z
  .string({
    required_error: "Enter a title for this page",
  })
  .min(1, { message: "Enter a title for this page" })
  .max(MAX_TITLE_LENGTH, {
    message: `Page title should be shorter than ${MAX_TITLE_LENGTH} characters.`,
  })

export const permalinkSchema = generateBasePermalinkSchema("page")
  .min(1, { message: "Enter a URL for this page" })
  .max(MAX_PAGE_URL_LENGTH, {
    message: `Page URL should be shorter than ${MAX_PAGE_URL_LENGTH} characters.`,
  })

export const basePageSchema = z.object({
  pageId: z.number().min(1),
  siteId: z.number().min(1),
})

export const reorderBlobSchema = z.object({
  pageId: z.number().min(1),
  from: z.number().min(0),
  to: z.number().min(0),
  siteId: z.number().min(1),
  blocks: z.array(
    z
      .object({
        type: z.string(),
      })
      .passthrough(),
  ),
})

export const updatePageBlobSchema = basePageSchema.extend({
  content: z.string(),
  siteId: z.number().min(1),
})

export const createPageSchema = z.object({
  title: pageTitleSchema,
  permalink: permalinkSchema,
  layout: z.enum(NEW_PAGE_LAYOUT_VALUES).default("content"),
  siteId: z.number().min(1),
  // NOTE: implies that top level pages are allowed
  folderId: z.number().min(1).optional(),
})

// TODO: siteId should be taken from user's context (not input)
export const publishPageSchema = z.object({
  pageId: z.number().min(1),
  siteId: z.number().min(1),
})

export const createCollectionPageFormSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("pdf"),
      url: z.string().url(),
    }),
    z.object({
      type: z.literal("page"),
    }),
  ])
  .and(
    createPageSchema
      .omit({
        layout: true,
        folderId: true,
        siteId: true,
      })
      .extend({
        category: z.string().optional(),
      }),
  )

export const createCollectionPageSchema = createCollectionPageFormSchema.and(
  z.object({
    collectionId: z.number().min(1),
    siteId: z.number().min(1),
  }),
)

export const getRootPageSchema = z.object({
  siteId: z.number().min(1),
})

export const basePageSettingsSchema = basePageSchema.extend({
  title: pageTitleSchema,
  meta: z.string().optional(),
})

export const rootPageSettingsSchema = basePageSettingsSchema.extend({
  type: z.literal(ResourceType.RootPage),
})

export const pageSettingsSchema = z.discriminatedUnion("type", [
  basePageSettingsSchema.extend({
    type: z.literal(ResourceType.Page),
    permalink: permalinkSchema,
  }),
  basePageSettingsSchema.extend({
    type: z.literal(ResourceType.CollectionPage),
    permalink: permalinkSchema,
  }),
  rootPageSettingsSchema,
])
