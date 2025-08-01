import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"
import { offsetPaginationSchema } from "./pagination"

export const MAX_FOLDER_TITLE_LENGTH = 100
export const MAX_FOLDER_PERMALINK_LENGTH = 200
export const MAX_FOLDER_DESCRIPTION_LENGTH = 300

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
  permalink: permalinkSchema,
  siteId: z.number().min(1),
  // Nullable for top level folder
  parentFolderId: z.number().optional(),
})

export const readFolderSchema = z
  .object({
    siteId: z.number().min(1),
    resourceId: z.number().min(1),
  })
  .merge(offsetPaginationSchema)

const baseFolderSchema = z.object({
  resourceId: z.string(),
  siteId: z.string(),
})

export const baseEditFolderSchema = baseFolderSchema.extend({
  permalink: permalinkSchema,
  title: z.string().min(1, { message: "Enter a title for this folder" }),
})

export const editFolderSchema = baseEditFolderSchema.superRefine(
  ({ permalink, title }, ctx) => {
    if (!permalink && !title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permalink", "title"],
        message: "Either permalink or title must be provided.",
      })
    }
  },
)

const baseIndexPageSchema = z.object({
  resourceId: z.string(),
  siteId: z.number().min(1),
})

export const getIndexpageSchema = baseIndexPageSchema

export const insertChildpageblockSchema = baseIndexPageSchema.extend({
  blocks: z.array(
    z
      .object({
        type: z.string(),
      })
      .passthrough(),
  ),
})

export const listChildPagesSchema = baseFolderSchema
  .omit({ resourceId: true })
  .extend({ indexPageId: z.string() })
