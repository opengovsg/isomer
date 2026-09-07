import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"
import { offsetPaginationSchema } from "./pagination"

export const MAX_FOLDER_TITLE_LENGTH = 250
// NOTE: 250 characters is the hard limit, and we want to be consistent with
// page permalink length limit
export const MAX_FOLDER_PERMALINK_LENGTH = 250

const permalinkSchema = generateBasePermalinkSchema("folder")
  .min(1, { message: "Enter a URL for this folder" })
  .max(MAX_FOLDER_PERMALINK_LENGTH, {
    message: `Folder URL should be shorter than ${MAX_FOLDER_PERMALINK_LENGTH} characters.`,
  })

export const createFolderSchema = z.object({
  folderTitle: z
    .string()
    .min(1, { message: "Enter a title for this folder" })
    .max(MAX_FOLDER_TITLE_LENGTH, {
      message: `Folder title should be shorter than ${MAX_FOLDER_TITLE_LENGTH} characters.`,
    }),
  parentFolderId: z.number().optional(),
  permalink: permalinkSchema,
  siteId: z.number().min(1),
})

export const readFolderSchema = z
  .object({
    resourceId: z.number().min(1),
    siteId: z.number().min(1),
  })
  .extend(offsetPaginationSchema.shape)

const baseFolderSchema = z.object({
  resourceId: z.string(),
  siteId: z.string(),
})

export const baseEditFolderSchema = baseFolderSchema.extend({
  permalink: permalinkSchema,
  shouldCreateRedirect: z.boolean().optional().default(true),
  title: z
    .string()
    .min(1, { message: "Enter a title for this folder" })
    .max(MAX_FOLDER_TITLE_LENGTH, {
      message: `Folder title should be shorter than ${MAX_FOLDER_TITLE_LENGTH} characters.`,
    }),
})

export const editFolderSchema = baseEditFolderSchema.superRefine(
  ({ permalink, title }, ctx) => {
    if (!permalink && !title) {
      ctx.addIssue({
        code: "custom",
        message: "Either permalink or title must be provided.",
        path: ["permalink", "title"],
      })
    }
  },
)

const baseIndexPageSchema = z.object({
  resourceId: z.string(),
  siteId: z.number().min(1),
})

export const getIndexpageSchema = baseIndexPageSchema

export const listChildPagesSchema = baseFolderSchema
  .omit({ resourceId: true })
  .extend({ indexPageId: z.string() })
