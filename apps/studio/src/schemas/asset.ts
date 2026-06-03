import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { z } from "zod"
import {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  MAX_SVG_FILE_SIZE_BYTES,
} from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

// Combine allowed extensions from existing constants
const ALLOWED_EXTENSIONS = [
  ...Object.keys(IMAGE_ACCEPTED_MIME_TYPE_MAPPING),
  ...Object.keys(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING),
]

const fileNameStartingCharRefine = (s: string) => /^[a-zA-Z0-9\-_]/.test(s)
const fileNameStartingCharMessage =
  "File name must start with a letter, number, hyphen, or underscore"

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
  fileName: z
    .string({
      error: "Missing file name",
    })
    .refine(fileNameStartingCharRefine, {
      message: fileNameStartingCharMessage,
    })
    // Check if extension is in allowed list (whitelist approach)
    // To ensure we don't allow any other file types that can have security implications
    .refine(
      (fileName) => {
        // Must have an extension
        if (!fileName.includes(".")) {
          return false
        }

        // Check if extension is in allowed list (whitelist approach)
        const extension = fileName
          .toLowerCase()
          .substring(fileName.lastIndexOf("."))

        // SVGs must go through the dedicated uploadSvg endpoint which
        // sanitizes the content server-side before uploading to S3.
        // The presigned PUT path never sees the file bytes, so it cannot
        // validate or strip embedded scripts/event handlers.
        if (extension === ".svg") return false

        return ALLOWED_EXTENSIONS.includes(extension)
      },
      {
        message: "File type not allowed. Please upload a supported file type.",
      },
    ),
})

export const uploadSvgSchema = z.object({
  siteId: z.number().min(1),
  fileName: z
    .string()
    .refine(fileNameStartingCharRefine, {
      message: fileNameStartingCharMessage,
    })
    .refine((s) => s.toLowerCase().endsWith(".svg"), {
      message: "Only .svg files are allowed",
    })
    .max(255),
  content: z.string().max(MAX_SVG_FILE_SIZE_BYTES, {
    message: `SVG file size must not exceed ${MAX_SVG_FILE_SIZE_BYTES / 1_000_000} MB`,
  }),
  resourceId: z.string().optional(),
  tags: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
})

export const deleteAssetsSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.string(),
  fileKeys: z.array(
    z.string({
      error: "Missing file keys",
    }),
  ),
})

export const getPresignedGetUrlSchema = z.object({
  siteId: z.number().min(1),
  fileKey: z.string({
    error: "Missing file key",
  }),
})
