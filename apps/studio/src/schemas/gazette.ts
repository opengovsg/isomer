import { z } from "zod"

import { offsetPaginationSchema } from "./pagination"

export const createGazetteSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(255, { message: "Title should be shorter than 255 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  subcategory: z.string().min(1, { message: "Subcategory is required" }),
  // NOTE: Not required for advertisements
  notificationNumber: z.string().optional(),
  publishDate: z.date({ required_error: "Date of publication is required" }),
  publishTime: z
    .string()
    .min(1, { message: "Time of publication is required" }),
  fileId: z
    .string()
    .min(1, { message: "File ID is required" })
    .regex(/^[_\-a-zA-Z0-9]+\.pdf$/, {
      message:
        "File ID must end in .pdf and consist of alphanumeric characters, underscores and hyphens",
    }),
})

export type CreateGazetteInput = z.infer<typeof createGazetteSchema>

const gazetteMetadataSchema = z.object({
  title: z.string().min(1).max(255),
  category: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Date must be dd/MM/yyyy" }),
  description: z.string().optional(),
  tagged: z.array(z.string()).min(1),
  scheduledAt: z.date(),
})

export const gazetteListSchema = z
  .object({
    siteId: z.number().min(1),
    collectionId: z.number().min(1),
  })
  .merge(offsetPaginationSchema)

export const createGazetteServerSchema = gazetteMetadataSchema.extend({
  siteId: z.number().min(1),
  collectionId: z.number().min(1),
  permalink: z.string().min(1),
  // The S3 key produced by the client-side presigned upload.
  ref: z.string().min(1),
})

export const updateGazetteServerSchema = gazetteMetadataSchema.extend({
  siteId: z.number().min(1),
  gazetteId: z.number().min(1),
  // Exactly one of `newRef` (a fresh upload) or `desiredFileName` (rename the
  // existing file) is meaningful per call. If both are absent, the existing
  // ref is kept as-is.
  newRef: z.string().min(1).optional(),
  desiredFileName: z
    .string()
    .min(1)
    .regex(/^[_\-a-zA-Z0-9]+\.pdf$/)
    .optional(),
})
