import { IMAGE_ACCEPTED_MIME_TYPE_MAPPING } from "@opengovsg/isomer-components"
import { z } from "zod"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

// Combine allowed extensions from existing constants
const ALLOWED_EXTENSIONS = [
  ...Object.keys(IMAGE_ACCEPTED_MIME_TYPE_MAPPING),
  ...Object.keys(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING),
]

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
    .refine(
      (s) => {
        const allowedStartingChars = new RegExp(/^[a-zA-Z0-9-_]/)
        return allowedStartingChars.test(s)
      },
      {
        message:
          "File name must start with a letter, number, hyphen, or underscore",
      },
    )
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
        return ALLOWED_EXTENSIONS.includes(extension)
      },
      {
        message: "File type not allowed. Please upload a supported file type.",
      },
    ),
})

// Upper bound on how many assets a single deleteAssets call may target.
// Each key fans out to paid S3 tagging calls, so an uncapped array lets one
// authenticated caller drive an unbounded number of S3 operations. Legitimate
// saves only delete a handful of keys, so 100 sits far above real usage.
export const MAX_DELETE_FILE_KEYS = 100

export const deleteAssetsSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.string(),
  fileKeys: z
    .array(
      z.string({
        error: "Missing file keys",
      }),
    )
    .max(MAX_DELETE_FILE_KEYS, {
      message: `You can only delete up to ${MAX_DELETE_FILE_KEYS} assets at a time`,
    }),
})

export const getPresignedGetUrlSchema = z.object({
  siteId: z.number().min(1),
  fileKey: z.string({
    error: "Missing file key",
  }),
})
