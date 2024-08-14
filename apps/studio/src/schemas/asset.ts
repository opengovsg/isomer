import { z } from "zod"

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
  fileName: z.string({
    required_error: "Missing file name",
  }),
})

export const deleteAssetSchema = z.object({
  fileKey: z.string({
    required_error: "Missing file key",
  }),
})
