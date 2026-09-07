import { z } from "zod"
import { MAX_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import { formatFileSizeLimit } from "~/utils/formatFileSizeLimit"

import { offsetPaginationSchema } from "./pagination"

export const createGazetteSchema = z.object({
  category: z.string().min(1, { message: "Category is required" }),
  fileId: z
    .string()
    .min(1, { message: "File ID is required" })
    .regex(/^[_\-a-zA-Z0-9]+\.pdf$/u, {
      message:
        "File ID must end in .pdf and consist of alphanumeric characters, underscores and hyphens",
    }),
  // NOTE: Not required for advertisements
  notificationNumber: z.string().optional(),
  publishDate: z.date({ error: "Date of publication is required" }),
  publishTime: z
    .string()
    .min(1, { message: "Time of publication is required" }),
  subcategory: z.string().min(1, { message: "Subcategory is required" }),
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(255, { message: "Title should be shorter than 255 characters" }),
})

export type CreateGazetteInput = z.infer<typeof createGazetteSchema>

const gazetteMetadataSchema = z.object({
  category: z.string().min(1),
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/u, { message: "Date must be dd/MM/yyyyu" }),
  description: z.string().optional(),
  scheduledAt: z.date(),
  tagged: z.array(z.string()).min(1),
  title: z.string().min(1).max(255),
})

export const gazetteListSchema = z
  .object({
    collectionId: z.number().min(1),
    siteId: z.number().min(1),
  })
  .extend(offsetPaginationSchema.shape)

export const createGazetteServerSchema = gazetteMetadataSchema.extend({
  collectionId: z.number().min(1),
  permalink: z.string().min(1),
  // The S3 key produced by the client-side presigned upload.
  ref: z.string().min(1),
  siteId: z.number().min(1),
})

export const updateGazetteServerSchema = gazetteMetadataSchema.extend({
  desiredFileName: z
    .string()
    .min(1)
    .regex(/^[_\-a-zA-Z0-9]+\.pdf$/u)
    .optional(),
  gazetteId: z.number().min(1),
  // Exactly one of `newRef` (a fresh upload) or `desiredFileName` (rename the
  // existing file) is meaningful per call. If both are absent, the existing
  // ref is kept as-is.
  newRef: z.string().min(1).optional(),
  siteId: z.number().min(1),
})

export const cancelScheduledPublishSchema = z.object({
  gazetteId: z.number().min(1),
  siteId: z.number().min(1),
})

export const deleteGazetteSchema = z.object({
  gazetteId: z.number().min(1),
  siteId: z.number().min(1),
})

export const getPresignedGetUrlSchema = z.object({
  fileKey: z
    .string()
    .min(1)
    // Defence-in-depth against path-traversal-style fileKeys (e.g.
    // "/SITE_ID/x.pdf" or "../y.pdf"). S3 keys for gazettes are always relative
    // and have no path traversal segments.
    .refine((s) => !s.startsWith("/") && !s.split("/").includes(".."), {
      message: "Invalid fileKey",
    }),
  siteId: z.number().min(1),
})

export const getPresignedPutUrlSchema = z.object({
  category: z.string().trim().min(1),
  fileName: z
    .string({
      error: "Missing file name",
    })
    .refine((s) => /^[a-zA-Z0-9-_]/u.test(s), {
      message:
        "File name must start with a letter, number, hyphen, or underscore",
    })
    .refine((fileName) => fileName.trim().toLowerCase().endsWith(".pdf"), {
      message: "Only PDF files are allowed.",
    }),
  fileSize: z
    .number({ error: "Missing file size" })
    .int()
    .min(1, { message: "File size must be greater than 0 bytes" })
    .max(MAX_FILE_SIZE_BYTES, {
      message: `File size must not exceed ${formatFileSizeLimit({ bytes: MAX_FILE_SIZE_BYTES })}`,
    }),
  resourceId: z.string().optional(),
  siteId: z.number().min(1),
  subcategory: z.string().trim().min(1),
  tags: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  year: z.number().min(1000).max(9999),
})
