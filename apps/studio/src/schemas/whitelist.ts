import { z } from "zod"

export const isEmailWhitelistedInputSchema = z.object({
  siteId: z.number().min(1),
  email: z.email(),
})

export const isEmailWhitelistedOutputSchema = z.boolean()

// Helper schema to normalize and deduplicate email array
// Trims, lowercases, filters empty strings, and removes duplicates
const emailArraySchema = z
  .array(z.string())
  .transform((emails) => {
    const normalized = new Set<string>()
    for (const email of emails) {
      const trimmed = email.trim().toLowerCase()
      if (trimmed.length > 0) {
        normalized.add(trimmed)
      }
    }
    return [...normalized]
  })
  .pipe(z.array(z.email()))

export const whitelistEmailsInputSchema = z.object({
  adminEmails: emailArraySchema,
  vendorEmails: emailArraySchema,
})
