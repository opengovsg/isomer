import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ARRAY_RADIO_FORMAT } from "../format"

// TODO: maybe also move this outside of this file as a shared interface
export const NATIVE_SEARCHABLE_TABLE_TYPE = "native"
export const DGS_SEARCHABLE_TABLE_TYPE = "dgs"

export const NativeSearchableTableSchema = Type.Object({
  variant: Type.Literal(NATIVE_SEARCHABLE_TABLE_TYPE, {
    default: NATIVE_SEARCHABLE_TABLE_TYPE,
  }),
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
  variant: Type.Literal(DGS_SEARCHABLE_TABLE_TYPE, {
    default: DGS_SEARCHABLE_TABLE_TYPE,
  }),
  dgsResourceId: Type.String({
    title: "DGS Resource ID",
    description: "The DGS resource ID to fetch the data from",
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
