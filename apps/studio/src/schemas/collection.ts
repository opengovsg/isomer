import type { LinkRefPageSchema } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import { format, parse } from "date-fns"
import { z } from "zod"
import { hasNonEmptyString } from "~/utils/truthiness"

import { generateBasePermalinkSchema } from "./common"
import { MAX_FOLDER_PERMALINK_LENGTH, MAX_FOLDER_TITLE_LENGTH } from "./folder"
import { offsetPaginationSchema } from "./pagination"
import { resourceOrderByOptions } from "./resource"

export type CollectionLinkProps = Static<typeof LinkRefPageSchema>

// NOTE: zod's internal date schema uses `YYYY-MM-DD` but our format is
// dd/MM/yyyy. Hence, we will run a 2 way conversion from
// our format -> zod then zod -> our format
// If the date is nullish, then we will return as undefined
const SLASH_DATE_FORMAT = "dd/MM/yyyy"

const slashDateSchema = z
  .string()
  .nullish()
  .transform((d) =>
    hasNonEmptyString(d)
      ? parse(d, SLASH_DATE_FORMAT, new Date())
      : undefined,
  )
  .pipe(z.date().optional())
  .transform((d) => (d === undefined ? undefined : format(d, SLASH_DATE_FORMAT)))

export const editLinkSchema = z.object({
  category: z.string(),
  date: slashDateSchema.optional(),
  description: z.string().optional(),
  image: z
    .object({
      alt: z.string(),
      src: z.string(),
    })
    .optional(),
  linkId: z.number().min(1),
  ref: z.string().min(1),
  siteId: z.number().min(1),
  tagged: z.array(z.string()).optional(),
  tags: z
    .array(
      z.object({
        category: z.string(),
        selected: z.array(z.string()).optional(),
      }),
    )
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
  parentFolderId: z.number().optional(),
  permalink: permalinkSchema,
  siteId: z.number().min(1),
})

export const getCollectionTagsSchema = z
  .object({
    collectionId: z.number().min(1).optional(),
    resourceId: z.number().min(1).optional(),
    siteId: z.number().min(1),
  })
  .refine(
    (data) =>
      (data.resourceId !== undefined) !== (data.collectionId !== undefined),
    { message: "Exactly one of resourceId or collectionId must be provided" },
  )

export const getCollectionsSchema = z.object({
  hasChildren: z.boolean().optional().default(false),
  siteId: z.number().min(1),
})

export const readCollectionSchema = z
  .object({
    orderBy: z.enum(resourceOrderByOptions).optional().default("updated-desc"),
    resourceId: z.number().min(1),
    siteId: z.number().min(1),
  })
  .extend(offsetPaginationSchema.shape)

// Upper bound to limit request parsing and SQL cost (ANY(...) on text[]).
// Arbitrary limit to prevent abuse; adjust if legitimate collections exceed this.
export const MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT = 100

/** Counts child collection pages/links whose `tagged` includes any of these option ids. */
export const countTagOptionsUsageSchema = z.object({
  pageId: z.number().min(1),
  // pageId is the collection index page resource id
  siteId: z.number().min(1),
  tagOptionIds: z.array(z.uuid()).max(MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT, {
    message: `At most ${MAX_TAG_OPTION_IDS_FOR_USAGE_COUNT} tag options can be queried at once`,
  }),
})
