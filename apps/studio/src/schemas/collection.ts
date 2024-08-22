import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"
import { MAX_FOLDER_PERMALINK_LENGTH, MAX_FOLDER_TITLE_LENGTH } from "./folder"

const permalinkSchema = generateBasePermalinkSchema("folder")
  .min(1, { message: "Enter a URL for this folder" })
  .max(MAX_FOLDER_PERMALINK_LENGTH, {
    message: `Folder URL should be shorter than ${MAX_FOLDER_PERMALINK_LENGTH} characters.`,
  })

export const createCollectionSchema = z.object({
  collectionTitle: z
    .string()
    .min(1, { message: "Enter a title for this folder" })
    .max(MAX_FOLDER_TITLE_LENGTH, {
      message: `Folder title should be shorter than ${MAX_FOLDER_TITLE_LENGTH} characters.`,
    }),
  permalink: permalinkSchema,
  siteId: z.number().min(1),
})
