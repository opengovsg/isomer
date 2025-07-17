import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"

export const NativeSearchableTableSchema = Type.Object({
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
  ),
})

export type DGSSearchableTableProps = Static<
  typeof DGSSearchableTableSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export const SearchableTableSchema = Type.Union([
  NativeSearchableTableSchema,
  DGSSearchableTableSchema,
])

export type SearchableTableProps =
  | NativeSearchableTableProps
  | DGSSearchableTableProps
