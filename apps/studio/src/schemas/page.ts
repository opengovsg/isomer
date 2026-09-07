import type { IsomerSchema } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { z } from "zod"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import { generateBasePermalinkSchema } from "./common"

const schemaValidator = ajv.compile<IsomerSchema>(schema)

export const NEW_PAGE_LAYOUT_VALUES = [
  "content",
  "article",
  "database",
] as const satisfies readonly PrismaJson.BlobJsonContent["layout"][]

export const MAX_TITLE_LENGTH = 250
// NOTE: 250 characters is the hard limit as file names have a max limit of 255
// characters, and the file name includes ".json" suffix
export const MAX_PAGE_URL_LENGTH = 250

const pageTitleSchema = z
  .string({
    error: "Enter a title for this page",
  })
  .min(1, { message: "Enter a title for this page" })
  .max(MAX_TITLE_LENGTH, {
    message: `Page title should be shorter than ${MAX_TITLE_LENGTH} characters.`,
  })

const permalinkSchema = generateBasePermalinkSchema("page")
  .min(1, { message: "Enter a URL for this page" })
  .max(MAX_PAGE_URL_LENGTH, {
    message: `Page URL should be shorter than ${MAX_PAGE_URL_LENGTH} characters.`,
  })

export const listPagesSchema = z.object({
  resourceId: z.number().optional(),
  siteId: z.number(),
})

export const basePageSchema = z.object({
  pageId: z.number().min(1),
  siteId: z.number().min(1),
})

export const reorderBlobSchema = z.object({
  blocks: z.array(
    z.looseObject({
      type: z.string(),
    }),
  ),
  from: z.number().min(0),
  pageId: z.number().min(1),
  siteId: z.number().min(1),
  to: z.number().min(0),
})

export const updatePageBlobSchema = basePageSchema.extend({
  content: z.string().transform((value, ctx) => {
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = safeJsonParse(value)
    if (schemaValidator(parsed)) {
      return parsed
    }
    ctx.addIssue({
      code: "custom",
      message: "Invalid page content",
    })
    return z.NEVER
  }),
  siteId: z.number().min(1),
})

export const createPageSchema = z.object({
  folderId: z.number().min(1).optional(),
  layout: z.enum(NEW_PAGE_LAYOUT_VALUES).default("content"),
  permalink: permalinkSchema,
  siteId: z.number().min(1),
  title: pageTitleSchema,
})

// Deferred: siteId should be taken from user's context (not input)
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
        folderId: true,
        layout: true,
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
  shouldCreateRedirect: z.boolean().optional().default(true),
  title: pageTitleSchema,
})

const rootPageSettingsSchema = basePageSettingsSchema.extend({
  type: z.literal(ResourceType.RootPage),
})

export const pageSettingsSchema = z.discriminatedUnion("type", [
  basePageSettingsSchema.extend({
    permalink: permalinkSchema,
    type: z.literal(ResourceType.Page),
  }),
  basePageSettingsSchema.extend({
    permalink: permalinkSchema,
    type: z.literal(ResourceType.CollectionPage),
  }),
  basePageSettingsSchema.extend({
    type: z.literal(ResourceType.IndexPage),
  }),
  basePageSettingsSchema.extend({
    type: z.literal(ResourceType.CollectionLink),
  }),
  rootPageSettingsSchema,
])

export const readPageOutputSchema = z.object({
  createdAt: z.date(),
  draftBlobId: z.string().nullable(),
  id: z.string(),
  parentId: z.string().nullable(),
  permalink: z.string(),
  publishedVersionId: z.string().nullable(),
  scheduledAt: z.date().nullable(),
  scheduledBy: z.string().nullable(),
  siteId: z.number(),
  state: z.enum(ResourceState).nullable(),
  title: z.string(),
  type: z.enum(ResourceType),
  updatedAt: z.date(),
})

export const updatePageMetaSchema = z.object({
  meta: z.string(),
  resourceId: z.string().min(1),
  siteId: z.number().min(1),
})

export const createIndexPageSchema = z.object({
  parentId: z.string(),
  siteId: z.number().min(1),
})

export const getPrefillSchema = z.object({
  resourceId: z.string().regex(/^\d+$/u),
  siteId: z.number().min(1),
})
