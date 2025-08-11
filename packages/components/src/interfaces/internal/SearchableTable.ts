import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ARRAY_RADIO_FORMAT } from "../format"
import { DATA_SOURCE_TYPE } from "../integration/dataSource"

export const NativeSearchableTableSchema = Type.Object({
  // "optional" to ensure backward compatibility
  dataSource: Type.Optional(
    Type.Object({
      type: Type.Literal(DATA_SOURCE_TYPE.native, {
        default: DATA_SOURCE_TYPE.native,
      }),
    }),
  ),
  title: Type.Optional(Type.String()),
  headers: Type.Array(Type.Union([Type.String(), Type.Number()])),
  items: Type.Array(Type.Array(Type.Union([Type.String(), Type.Number()]))),
})

export type NativeSearchableTableProps = Static<
  typeof NativeSearchableTableSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export const DGSSearchableTableSchema = Type.Object({
  dataSource: Type.Object({
    type: Type.Literal(DATA_SOURCE_TYPE.dgs, {
      default: DATA_SOURCE_TYPE.dgs,
    }),
    resourceId: Type.String({
      title: "DGS Resource ID",
      description: "The resource ID to fetch data from DGS",
    }),
    filters: Type.Optional(
      Type.Array(
        Type.Object({
          fieldKey: Type.String(),
          fieldValue: Type.String(),
        }),
      ),
    ),
    sort: Type.Optional(Type.String()),
  }),
  title: Type.String({
    title: "Title",
    description: "The title of the table",
  }),
  headers: Type.Array(
    Type.Object({
      label: Type.String({
        title: "Label",
        description: "The label of the header",
      }),
      key: Type.String({
        title: "Key",
        description: "The key of the header in DGS table",
      }),
    }),
    { minItems: 1 },
  ),
})

export type DGSSearchableTableProps = Static<
  typeof DGSSearchableTableSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export const SearchableTableSchema = Type.Intersect(
  [
    Type.Union([NativeSearchableTableSchema, DGSSearchableTableSchema], {
      title: "Searchable Table",
      format: ARRAY_RADIO_FORMAT,
    }),
  ],
  {
    title: "Searchable Table",
  },
)

export type SearchableTableProps = Static<typeof SearchableTableSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
