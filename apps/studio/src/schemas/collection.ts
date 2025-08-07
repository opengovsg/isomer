import { format, parse } from "date-fns"
import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"
import { MAX_FOLDER_PERMALINK_LENGTH, MAX_FOLDER_TITLE_LENGTH } from "./folder"

// NOTE: zod's internal date schema uses `YYYY-MM-DD` but our format is
// dd/mm/yyyy. Hence, we will run a 2 way conversion from
// our format -> zod then zod -> our format
// If the date is nullish, then we will return as undefined
const slashDateSchema = z
  .string()
  .nullish()
  .transform((d) => {
    if (!d) {
      return undefined
    }

    return parse(d, "dd/mm/yyyy", new Date())
  })
  .pipe(z.date().nullish())
  .transform((d) => {
    if (!d) {
      return undefined
    }

    return format(d, "dd/mm/yyyy")
  })

export const editLinkSchema = z.object({
  date: slashDateSchema.optional(),
  category: z.string(),
  linkId: z.number().min(1),
  siteId: z.number().min(1),
  description: z.string().optional(),
  ref: z.string().min(1),
  image: z
    .object({
      src: z.string(),
      alt: z.string().max(120),
    })
    .optional(),
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

export const getCollectionTagsSchema = z.object({
  resourceId: z.number().min(1),
  siteId: z.number().min(1),
})

export const getCollectionsSchema = z.object({
  siteId: z.number().min(1),
  hasChildren: z.boolean().optional().default(false),
})
