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

// Client-side convenience applied just before validation, so users don't have
// to type the scheme the published site serves over:
//   - an "http://" destination is upgraded to "https://"
//   - a leading "www." host gets "https://" prefixed
// A "www." prefix unambiguously signals an external host (an internal path
// starts with "/"), so it's safe to infer. A schemeless host WITHOUT "www."
// ("google.com") is left untouched — it's ambiguous against an internal path
// ("/test.zip" vs "test.zip") — and fails validation as an invalid URL.
// This lives only on the form; the shared server schema is unchanged.
const normalizeDestinationScheme = (value: string): string => {
  if (value.startsWith("http://")) {
    return `https://${value.slice("http://".length)}`
  }
  if (value.startsWith("www.")) {
    return `https://${value}`
  }
  return value
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
