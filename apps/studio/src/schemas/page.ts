import { z } from "zod"

const NEW_PAGE_LAYOUT_VALUES = [
  "article",
  "content",
] as const satisfies readonly PrismaJson.BlobJsonContent["layout"][]

export const MAX_TITLE_LENGTH = 150
export const MAX_PAGE_URL_LENGTH = 250

export const getEditPageSchema = z.object({
  pageId: z.number().min(1),
  siteId: z.number().min(1),
})

export const getPageSchema = z.object({
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

export const updatePageSchema = getEditPageSchema.extend({
  // NOTE: We allow both to be empty now,
  // in which case this is a no-op.
  // We are ok w/ this because it doesn't
  // incur any db writes
  parentId: z.number().min(1).optional(),
  pageName: z.string().min(1).optional(),
})

export const updatePageBlobSchema = getEditPageSchema.extend({
  content: z.string(),
  siteId: z.number().min(1),
})

export const createPageSchema = z.object({
  title: z
    .string({
      required_error: "Enter a title for this page",
    })
    .min(1, { message: "Enter a title for this page" })
    .max(MAX_TITLE_LENGTH, {
      message: `Page title should be shorter than ${MAX_TITLE_LENGTH} characters.`,
    }),
  permalink: z
    .string({
      required_error: "Enter a URL for this page.",
    })
    // Using `*` instead of `+` to allow empty strings, so the correct required error message is shown instead of the regex error message.
    .regex(/^[a-z0-9\-]*$/, {
      message: "Only lowercase alphanumeric characters and hyphens are allowed",
    })
    .min(1, { message: "Enter a URL for this page" })
    .max(MAX_PAGE_URL_LENGTH, {
      message: `Page URL should be shorter than ${MAX_PAGE_URL_LENGTH} characters.`,
    }),
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
