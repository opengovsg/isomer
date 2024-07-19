import { z } from "zod"

const PAGE_LAYOUTS = ["content"] as const

export const MAX_TITLE_LENGTH = 150
export const MAX_PAGE_URL_LENGTH = 250

export const getEditPageSchema = z.object({
  pageId: z.number().min(1),
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
})

export const createPageSchema = z.object({
  pageTitle: z
    .string({
      required_error: "Enter a title for this page",
    })
    .min(1, { message: "Enter a title for this page" })
    .max(MAX_TITLE_LENGTH, {
      message: `Page title should be shorter than ${MAX_TITLE_LENGTH} characters.`,
    }),
  pageUrl: z
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
  // TODO: add the actual layouts in here
  layout: z.enum(PAGE_LAYOUTS).default("content"),
  siteId: z.number().min(1),
  // NOTE: implies that top level pages are allowed
  folderId: z.number().min(1).optional(),
})
export const readImageInPageSchema = z.object({
  imageUrlInSchema: z.string(),
})

export const getPresignUrlForImageUploadSchema = z.object({
  siteId: z.number().min(1),
  pageId: z.number().min(1),
})
