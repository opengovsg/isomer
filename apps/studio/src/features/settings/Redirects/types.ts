import type { z } from "zod"
import type { RouterOutput } from "~/utils/trpc"
import {
  createRedirectObjectSchema,
  refineSourceDestinationDiffer,
} from "~/schemas/redirect"

// A live redirect row as returned by the server, so the table type can never
// drift from what `redirect.list` actually responds with
export type RedirectRow = RouterOutput["redirect"]["list"][number]

export type { RedirectSortField } from "~/schemas/redirect"

// The add form collects everything except siteId, which comes from the route.
// Reusing the server schema (object + cross-field refinement) keeps client and
// server validation identical.
export const addRedirectSchema = createRedirectObjectSchema
  .omit({ siteId: true })
  .superRefine(refineSourceDestinationDiffer)
export type AddRedirectInput = z.infer<typeof addRedirectSchema>
