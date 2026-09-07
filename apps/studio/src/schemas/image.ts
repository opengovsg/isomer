import { z } from "zod"
import { basePageSchema } from "~/schemas/page"

export const generateAltTextSchema = basePageSchema.extend({
  src: z.string({ error: "Missing image path" }),
  mimeType: z.string({ error: "Missing image MIME type" }),
  componentType: z.string({ error: "Missing component type" }),
  surroundingText: z.string().optional(),
})
export type GenerateAltTextInput = z.infer<typeof generateAltTextSchema>
