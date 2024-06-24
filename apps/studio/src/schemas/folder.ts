import { z } from 'zod'

const MAX_FOLDER_TITLE_LENGTH = 100
const MAX_FOLDER_PERMALINK_LENGTH = 200
const MAX_FOLDER_DESCRIPTION_LENGTH = 300

export const createFolderSchema = z.object({
  folderTitle: z.string().max(MAX_FOLDER_TITLE_LENGTH),
  folderDescription: z.string().max(MAX_FOLDER_DESCRIPTION_LENGTH),
  permalink: z.string().max(MAX_FOLDER_PERMALINK_LENGTH),
  siteId: z.string(),
  // Nullable for top level folder
  parentFolderId: z.string().nullable(),
})

export const readFolderSchema = z.object({
  siteId: z.string(),
  resourceId: z.string(),
})
