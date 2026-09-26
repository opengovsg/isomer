import { z } from "zod"
import { basePageSchema } from "~/schemas/page"

export const generateAltTextSchema = basePageSchema.extend({
  src: z.string({ error: "Missing image path" }),
  surroundingText: z.string().optional(),
})
export type GenerateAltTextInput = z.infer<typeof generateAltTextSchema>
