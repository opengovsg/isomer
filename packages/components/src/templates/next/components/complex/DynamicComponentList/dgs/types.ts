import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

// TODO: to move to somewhere else as shared interface
const DGSSuccessResponse = Type.Object({
  success: Type.Literal(true, { default: true }),
  result: Type.Object({
    resource_id: Type.String(),
    records: Type.Array(Type.Record(Type.String(), Type.Any())),
    total: Type.Number(),
    limit: Type.Number(),
  }),
})
const DGSFailureResponse = Type.Object({
  success: Type.Literal(false, { default: false }),
})
const _DGSResponseSchema = Type.Union([DGSSuccessResponse, DGSFailureResponse])

export type DGSSuccessResponse = Static<typeof DGSSuccessResponse>
export type DGSFailureResponse = Static<typeof DGSFailureResponse>
export type DGSResponse = Static<typeof _DGSResponseSchema>
