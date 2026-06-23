import type { RouterOutput } from "~/utils/trpc"
import { z } from "zod"
import {
  createRedirectObjectSchema,
  refineSourceDestinationDiffer,
} from "~/schemas/redirect"

// A live redirect row as returned by the server, so the table type can never
// drift from what `redirect.list` actually responds with
export type RedirectRow = RouterOutput["redirect"]["list"][number]

export type { RedirectSortField } from "~/schemas/redirect"

// Client-side convenience applied just before validation: turn what a user
// typed into a destination shape the schema accepts. A bare host ("google.com")
// gets "https://" prepended and an "http://" URL is upgraded to "https://" —
// matching how the published site serves links, so users don't have to type the
// scheme. Internal paths ("/..."), already-https URLs, and "[resource:...]"
// references are left untouched. This lives only on the form: the shared server
// schema stays strict, so a direct API caller must still send a full URL.
const normalizeDestinationScheme = (value: string): string => {
  const trimmed = value.trim()
  if (
    trimmed === "" ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("[") ||
    trimmed.startsWith("https://")
  ) {
    return value
  }
  if (trimmed.startsWith("http://")) {
    return `https://${trimmed.slice("http://".length)}`
  }
  return `https://${trimmed}`
}

// The add form collects everything except siteId, which comes from the route.
// Reusing the server schema's field rules keeps client and server validation
// identical; the destination first runs through the scheme fix-up (piped into
// the shared rules so the field's input type stays a plain string for the form).
export const addRedirectSchema = z
  .object({
    source: createRedirectObjectSchema.shape.source,
    destination: z
      .string()
      .transform(normalizeDestinationScheme)
      .pipe(createRedirectObjectSchema.shape.destination),
  })
  .superRefine(refineSourceDestinationDiffer)
export type AddRedirectInput = z.infer<typeof addRedirectSchema>
