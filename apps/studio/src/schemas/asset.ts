import { z } from "zod"

export const getPresignedPutUrlSchema = z.object({
  siteId: z.number().min(1),
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
