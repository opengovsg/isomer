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
  pageName: z.string(),
  pageTitle: z.string(),
  // TODO: add the actual layouts in here
  layout: z.enum(PAGE_LAYOUTS).default("content"),
  siteId: z.number().min(1),
  // NOTE: implies that top level pages are allowed
  folderId: z.number().min(1).optional(),
})
