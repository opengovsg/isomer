import type { IsomerSchema } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { z, ZodError } from "zod"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import {
  ResourceState,
  ResourceType,
  ScheduledAction,
} from "~prisma/generated/generatedEnums"

import { generateBasePermalinkSchema } from "./common"

const schemaValidator = ajv.compile<IsomerSchema>(schema)

export interface PageContentAjvError {
  instancePath: string
  keyword: string
}

const isPageContentAjvError = (
  value: unknown,
): value is PageContentAjvError => {
  if (typeof value !== "object" || value === null) return false
  if (!("instancePath" in value) || !("keyword" in value)) return false

  return (
    typeof value.instancePath === "string" && typeof value.keyword === "string"
  )
}

/** AJV path and rule from a failed `updatePageBlobSchema` parse. */
export const pageContentAjvErrors = (error: unknown): PageContentAjvError[] => {
  if (!(error instanceof ZodError)) return []

  return error.issues.flatMap((issue) => {
    if (issue.code !== z.ZodIssueCode.custom) return []
    const params: unknown = issue.params
    if (typeof params !== "object" || params === null) return []

    const ajvErrors = Reflect.get(params, "ajvErrors") as unknown
    if (!Array.isArray(ajvErrors)) return []
    return ajvErrors.filter(isPageContentAjvError)
  })
}

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
  siteId: z.number(),
  resourceId: z.number().optional(),
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
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsed = safeJsonParse(value)
    if (schemaValidator(parsed)) {
      return parsed
    }
    const ajvErrors = (schemaValidator.errors ?? []).map((error) => ({
      instancePath: error.instancePath,
      keyword: error.keyword,
    }))
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid page content",
      params: { ajvErrors },
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

export const unpublishPageSchema = z.object({
  pageId: z.number().min(1, { message: "Select a page to unpublish" }),
  siteId: z.number().min(1, { message: "Select a site" }),
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
  // Create a redirect from the page's old URL when its permalink changes (acted
  // on only for Page/CollectionPage). On the base so the union destructures
  // cleanly. Defaults on, matching the checkbox's default-checked state.
  shouldCreateRedirect: z.boolean().optional().default(true),
})

const rootPageSettingsSchema = basePageSettingsSchema.extend({
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
  scheduledAt: z.date().nullable(),
  scheduledBy: z.string().nullable(),
  scheduledAction: z.nativeEnum(ScheduledAction).nullable(),
  lastPublishedAt: z.date().nullable(),
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

export const getPrefillSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.string().regex(/^\d+$/),
})
