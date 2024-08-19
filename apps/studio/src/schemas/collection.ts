import { z } from "zod"

import { MAX_FOLDER_PERMALINK_LENGTH, MAX_FOLDER_TITLE_LENGTH } from "./folder"

export const createCollectionSchema = z.object({
  collectionTitle: z
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
})
