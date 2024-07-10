import { z } from "zod"

const PAGE_LAYOUTS = ["content"] as const

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
    .max(150, { message: "Page title should be shorter than 150 characters." }),
  pageUrl: z
    .string({
      required_error: "Enter a URL for this page.",
    })
    // TODO(ISOM-1187): Add tests for this regex, to ensure frontend is synchronized with backend
    .regex(/^[a-z0-9\-]+$/, {
      message: "Only lowercase alphanumeric characters and hyphens are allowed",
    })
    .min(1, { message: "Enter a URL for this page" })
    .max(250, { message: "Page URL should be shorter than 250 characters." }),
  // TODO: add the actual layouts in here
  layout: z.enum(PAGE_LAYOUTS).default("content"),
  siteId: z.number().min(1),
  // NOTE: implies that top level pages are allowed
  folderId: z.number().min(1).optional(),
})
