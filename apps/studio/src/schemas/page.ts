import { z } from "zod"

const NEW_PAGE_LAYOUT_VALUES = [
  "article",
  "content",
] satisfies PrismaJson.BlobJsonContent["layout"][]
type NewPageLayoutValues = (typeof NEW_PAGE_LAYOUT_VALUES)[number]

export const MAX_TITLE_LENGTH = 150
export const MAX_PAGE_URL_LENGTH = 250

export const getEditPageSchema = z.object({
  pageId: z.number().min(1),
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
  layout: z
    .enum<
      string,
      [NewPageLayoutValues]
    >(NEW_PAGE_LAYOUT_VALUES as [NewPageLayoutValues])
    .default("content"),
  siteId: z.number().min(1),
  // NOTE: implies that top level pages are allowed
  folderId: z.number().min(1).optional(),
})
