import { z } from "zod"

export const isEmailWhitelistedInputSchema = z.object({
  siteId: z.number().min(1),
  email: z.string().email(),
})

export const isEmailWhitelistedOutputSchema = z.boolean()

export const whitelistEmailsInputSchema = z.object({
  adminEmails: z.array(z.string().email()),
  vendorEmails: z.array(z.string().email()),
})
