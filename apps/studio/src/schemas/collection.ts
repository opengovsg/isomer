import { format, parse } from "date-fns"
import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"
import { MAX_FOLDER_PERMALINK_LENGTH, MAX_FOLDER_TITLE_LENGTH } from "./folder"

// NOTE: zod's internal date schema uses `YYYY-MM-DD` but our format is
// dd/mm/yyyy. Hence, we will run a 2 way conversion from
// our format -> zod then zod -> our format
const slashDateSchema = z
  .string()
  .transform((d) => {
    return parse(d, "dd/mm/yyyy", new Date())
  })
  .pipe(z.date())
  .transform((d) => {
    return format(d, "dd/mm/yyyy")
  })

export const editLinkSchema = z.object({
  date: slashDateSchema,
  category: z.string(),
  linkId: z.number().min(1),
  siteId: z.number().min(1),
  description: z.string().optional(),
  ref: z.string().min(1),
})

export const readLinkSchema = z.object({
  linkId: z.number().min(1),
  siteId: z.number().min(1),
})

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
  // Nullable for top level folder
  parentFolderId: z.number().optional(),
})
