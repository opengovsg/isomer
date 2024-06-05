import { z } from 'zod'

export const createFolderSchema = z.object({
  folderTitle: z.string(),
  folderDescription: z.string(),
  permalink: z.string(),
  siteId: z.string(),
  // Nullable for top level folder
  parentFolderId: z.string().nullable(),
})
