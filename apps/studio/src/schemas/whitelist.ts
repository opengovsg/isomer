import { z } from "zod"

export const isEmailWhitelistedInputSchema = z.object({
  siteId: z.number().min(1),
  email: z.string().email(),
})

export const isEmailWhitelistedOutputSchema = z.boolean()

// Helper schema to normalize and deduplicate email array
// Trims, lowercases, filters empty strings, and removes duplicates
const emailArraySchema = z
  .array(z.string())
  .transform((emails) => [
    ...new Set(
      emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0),
    ),
  ])
  .pipe(z.array(z.string().email()))

export const whitelistEmailsInputSchema = z.object({
  adminEmails: emailArraySchema,
  vendorEmails: emailArraySchema,
})
