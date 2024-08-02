import { z } from "zod"

export const MAX_FOLDER_TITLE_LENGTH = 100
export const MAX_FOLDER_PERMALINK_LENGTH = 200
export const MAX_FOLDER_DESCRIPTION_LENGTH = 300

export const createFolderSchema = z.object({
  folderTitle: z
    .string()
    .min(1, { message: "Enter a title for this folder" })
    .max(MAX_FOLDER_TITLE_LENGTH, {
      message: `Folder title should be shorter than ${MAX_FOLDER_TITLE_LENGTH} characters.`,
    }),
  permalink: z
    .string()
    .min(1, { message: "Enter a URL for this folder" })
    .max(MAX_FOLDER_PERMALINK_LENGTH, {
      message: `Folder URL should be shorter than ${MAX_FOLDER_PERMALINK_LENGTH} characters.`,
    }),
  siteId: z.number().min(1),
  // Nullable for top level folder
  parentFolderId: z.number().optional(),
})

export const readFolderSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.number().min(1),
})
