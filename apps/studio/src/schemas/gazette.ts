import { z } from "zod"

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
