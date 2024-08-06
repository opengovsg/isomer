import { z } from "zod"

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
  fileName: z.string({
    required_error: "Missing file name",
  }),
})
