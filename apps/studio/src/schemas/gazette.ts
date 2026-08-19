import { z } from "zod"
import { MAX_FILE_SIZE_BYTES } from "~/lib/fileUpload"
import { formatFileSizeLimit } from "~/utils/formatFileSizeLimit"

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
  publishDate: z.date({ error: "Date of publication is required" }),
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
  categoryId: z.string().min(1, { message: "Category is required" }),
  categoryLabel: z.string().min(1, { message: "Category is required" }),
  date: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, { message: "Date must be dd/MM/yyyy" }),
  description: z.string().optional(),
  // Category and subcategory travel as named ids. The server writes them to
  // `page.tagged` as `[categoryId, subcategoryId]`.
  //
  // This is not a positional `tagged` array input. The server owns that shape
  // so callers cannot slip extra ids into it or send a category id where a
  // subcategory id should be.
  subcategoryId: z.string().min(1, { message: "Subcategory is required" }),
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
  // At most one of `newRef` or `desiredFileName` matters per call. If both are
  // absent, the existing ref stays as-is.
  newRef: z.string().min(1).optional(),
  desiredFileName: z
    .string()
    .min(1)
    .regex(/^[_\-a-zA-Z0-9]+\.pdf$/)
    .optional(),
})

export const cancelScheduledPublishSchema = z.object({
  siteId: z.number().min(1),
  gazetteId: z.number().min(1),
})

export const deleteGazetteSchema = z.object({
  siteId: z.number().min(1),
  gazetteId: z.number().min(1),
})

export const getPresignedGetUrlSchema = z.object({
  siteId: z.number().min(1),
  fileKey: z
    .string()
    .min(1)
    // Defense in depth against path-traversal-style fileKeys like
    // "/SITE_ID/x.pdf" or "../y.pdf". Gazette S3 keys are always relative.
    .refine((s) => !s.startsWith("/") && !s.split("/").includes(".."), {
      message: "Invalid fileKey",
    }),
})

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
  tags: z
    .array(
      z.object({
        key: z.string(),
        value: z.string(),
      }),
    )
    .optional(),
  resourceId: z.string().optional(),
  year: z.number().min(1000).max(9999),
  category: z.string().trim().min(1),
  subcategory: z.string().trim().min(1),
  fileSize: z
    .number({ error: "Missing file size" })
    .int()
    .min(1, { message: "File size must be greater than 0 bytes" })
    .max(MAX_FILE_SIZE_BYTES, {
      message: `File size must not exceed ${formatFileSizeLimit({ bytes: MAX_FILE_SIZE_BYTES })}`,
    }),
  fileName: z
    .string({
      error: "Missing file name",
    })
    .refine((s) => /^[a-zA-Z0-9-_]/.test(s), {
      message:
        "File name must start with a letter, number, hyphen, or underscore",
    })
    .refine((fileName) => fileName.trim().toLowerCase().endsWith(".pdf"), {
      message: "Only PDF files are allowed.",
    }),
})
