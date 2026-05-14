import type { LinkRefPageSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { format, parse } from "date-fns"
import { z } from "zod"

import { generateBasePermalinkSchema } from "./common"
import { MAX_FOLDER_PERMALINK_LENGTH, MAX_FOLDER_TITLE_LENGTH } from "./folder"
import { offsetPaginationSchema } from "./pagination"

export type CollectionLinkProps = Static<typeof LinkRefPageSchema>

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
  tags: z
    .array(
      z.object({
        category: z.string(),
        selected: z.array(z.string()).optional(),
      }),
    )
    .optional(),
  tagged: z.array(z.string()).optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
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

export const getCollectionTagsSchema = z
  .object({
    resourceId: z.number().min(1).optional(),
    collectionId: z.number().min(1).optional(),
    siteId: z.number().min(1),
  })
  .refine(
    (data) =>
      (data.resourceId !== undefined) !== (data.collectionId !== undefined),
    { message: "Exactly one of resourceId or collectionId must be provided" },
  )

export const getCollectionsSchema = z.object({
  siteId: z.number().min(1),
  hasChildren: z.boolean().optional().default(false),
})

export const readCollectionOrderByOptions = [
  "updated-desc",
  "title-asc",
] as const

export const readCollectionSchema = z
  .object({
    siteId: z.number().min(1),
    resourceId: z.number().min(1),
    orderBy: z
      .enum(readCollectionOrderByOptions)
      .optional()
      .default("updated-desc"),
  })
  .merge(offsetPaginationSchema)

/** Counts child collection pages/links whose `tagged` includes any of these option ids. */
export const countTagOptionsUsageSchema = z.object({
  siteId: z.number().min(1),
  pageId: z.number().min(1), // pageId is the collection index page resource id
  tagOptionIds: z
    .array(z.string().uuid())
    // Upper bound to limit request parsing and SQL cost (ANY(...) on text[]).
    // Arbitrary limit to prevent abuse; adjust if legitimate collections exceed this.
    .max(100, {
      message: `At most 100 tag options can be queried at once`,
    }),
})
