import type { RedirectRowInput } from "~/schemas/redirect"
import type { RouterOutput } from "~/utils/trpc"
import { redirectRowSchema } from "~/schemas/redirect"

// A live redirect row as returned by the server, so the table type can never
// drift from what `redirect.list` actually responds with
export type RedirectRow = RouterOutput["redirect"]["list"][number]

export type { RedirectSortField } from "~/schemas/redirect"

// The add form collects exactly one redirect minus siteId (from the route) —
// the same shape a bulk-upload CSV row has, so both reuse the shared row schema
// (scheme fix-up + create-schema field rules). Aliased here so form code keeps
// referring to `addRedirectSchema`.
export const addRedirectSchema = redirectRowSchema
export type AddRedirectInput = RedirectRowInput
