import type { IsomerSchema } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"
import { z } from "zod"

import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { generateBasePermalinkSchema } from "./common"

const schemaValidator = ajv.compile<IsomerSchema>(schema)

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
  content: z.string().transform((value, ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = safeJsonParse(value)
    if (schemaValidator(parsed)) {
      return parsed
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid page content",
    })
    return z.NEVER
  }),
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
      type: z.literal(ResourceType.CollectionLink),
    }),
    z.object({
      type: z.literal(ResourceType.CollectionPage),
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
  basePageSettingsSchema.extend({
    type: z.literal(ResourceType.IndexPage),
  }),
  basePageSettingsSchema.extend({
    type: z.literal(ResourceType.CollectionLink),
    permalink: permalinkSchema,
  }),
  rootPageSettingsSchema,
])

export const readPageOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  permalink: z.string(),
  siteId: z.number(),
  parentId: z.string().nullable(),
  publishedVersionId: z.string().nullable(),
  draftBlobId: z.string().nullable(),
  state: z.nativeEnum(ResourceState).nullable(),
  type: z.nativeEnum(ResourceType),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const updatePageMetaSchema = z.object({
  meta: z.string(),
  siteId: z.number().min(1),
  resourceId: z.string().min(1),
})

export const createIndexPageSchema = z.object({
  siteId: z.number().min(1),
  parentId: z.string(),
})
