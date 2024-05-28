import { z } from "zod";

export const getEditPageSchema = z.object({
  pageId: z.string(),
  siteId: z.string()
})

export const updatePageSchema = z.object({
  // NOTE: We allow both to be empty now, 
  // in which case this is a no-op. 
  // We are ok w/ this because it doesn't 
  // incur any db writes
  parentId: z.string().nullable(),
  pageName: z.string().nullable(),
  siteId: z.string(),
  pageId: z.string()
})

export const updatePageBlobSchema = z.object({
  pageId: z.string(),
  siteId: z.string(),
  content: z.string()
})

export const createPageSchema = z.object({
  pageName: z.string(),
  pageTitle: z.string(),
  // TODO: add the actual layouts in here
  layout: z.enum(["content"]).default("content"),
  siteId: z.string(),
  // NOTE: implies that top level pages are allowed
  folderId: z.string().nullable()
})
