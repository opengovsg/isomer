import { z } from "zod"

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
  fileName: z.string({
    required_error: "Missing file name",
  }),
})

export const deleteAssetsSchema = z.object({
  fileKeys: z.array(
    z.string({
      required_error: "Missing file keys",
    }),
  ),
})
