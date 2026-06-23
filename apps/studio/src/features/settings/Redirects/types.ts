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

// Client-side convenience applied just before validation: upgrade an "http://"
// destination to "https://", since the published site serves over https. We do
// NOT infer a scheme for a schemeless host ("google.com") — that's ambiguous
// against an internal path (e.g. "/test.zip" vs "test.zip"), so it's left to
// fail validation as an invalid URL. Everything else is passed through
// untouched. This lives only on the form; the shared server schema is unchanged.
const normalizeDestinationScheme = (value: string): string =>
  value.startsWith("http://")
    ? `https://${value.slice("http://".length)}`
    : value

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
