import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { NON_EMPTY_STRING_REGEX } from "~/utils"

export const DGS_SEARCHABLE_TABLE_TYPE = "dgssearchabletable"

export const DGSSearchableTableSchema = Type.Object({
  type: Type.Literal(DGS_SEARCHABLE_TABLE_TYPE, {
    default: DGS_SEARCHABLE_TABLE_TYPE,
  }),
  dgsResourceId: Type.String({
    title: "DGS Resource ID",
    description: "The DGS resource ID to fetch the data from",
    pattern: NON_EMPTY_STRING_REGEX,
  }),
  title: Type.String({
    title: "Title",
    description: "The title of the table",
    pattern: NON_EMPTY_STRING_REGEX,
  }),
  headers: Type.Array(
    Type.Object({
      label: Type.String({
        title: "Label",
        description: "The label of the header",
        pattern: NON_EMPTY_STRING_REGEX,
      }),
      key: Type.String({
        title: "Key",
        description: "The key of the header in DGS table",
        pattern: NON_EMPTY_STRING_REGEX,
      }),
    }),
  ),
})

export type DGSSearchableTableProps = Static<
  typeof DGSSearchableTableSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

// TODO: to move to somewhere else as shared interface
const _DGSResponseSchema = Type.Object({
  result: Type.Object({
    resource_id: Type.String(),
    records: Type.Array(Type.Record(Type.String(), Type.Any())),
    total: Type.Number(),
    limit: Type.Number(),
  }),
})

export type DGSResponse = Static<typeof _DGSResponseSchema>
