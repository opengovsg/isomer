import { z } from "zod"

import {
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
} from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

// Combine allowed extensions from existing constants
const ALLOWED_EXTENSIONS = [
  ...Object.keys(IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING),
  ...Object.keys(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING),
]

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.string(),
  fileName: z
    .string({
      required_error: "Missing file name",
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

export const deleteAssetsSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.string(),
  fileKeys: z.array(
    z.string({
      required_error: "Missing file keys",
    }),
  ),
})
