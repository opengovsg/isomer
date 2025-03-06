import { z } from "zod"

export const isEmailWhitelistedInputSchema = z.object({
  siteId: z.number().min(1),
  email: z.string().email(),
})

export const isEmailWhitelistedOutputSchema = z.boolean()
