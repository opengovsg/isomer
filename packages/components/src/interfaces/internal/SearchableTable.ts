import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { DgsDataSourceSchema, NativeDataSourceSchema } from "../integration"

const BaseSearchableTableSchema = Type.Object({
  title: Type.Optional(
    Type.String({
      title: "Title",
      description: "The title of the table",
    }),
  ),
})

export const NativeSearchableTableSchema = Type.Intersect([
  NativeDataSourceSchema,
  Type.Object({
    headers: Type.Array(Type.Union([Type.String(), Type.Number()])),
    items: Type.Array(Type.Array(Type.Union([Type.String(), Type.Number()]))),
  }),
])

export const DGSSearchableTableSchema = Type.Intersect([
  DgsDataSourceSchema,
  Type.Object({
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
  }),
])

export const SearchableTableSchema = Type.Intersect([
  BaseSearchableTableSchema,
  Type.Union([NativeSearchableTableSchema, DGSSearchableTableSchema]),
])

// note: ideally we should not pass entire "site" object to the client component
// as it can be quite large and increase page size
// but since this is not a common component, we will allow it for now :(
export type SearchableTableClientProps = Static<
  typeof BaseSearchableTableSchema
> &
  Pick<NativeSearchableTableProps, "headers"> & {
    items: {
      row: NativeSearchableTableProps["items"][number]
      key: string
    }[]
  } & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
    isLoading?: boolean
    isError?: boolean
  }

export type NativeSearchableTableProps = Static<
  typeof BaseSearchableTableSchema
> &
  Static<typeof NativeSearchableTableSchema> & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type DGSSearchableTableProps = Static<typeof BaseSearchableTableSchema> &
  Static<typeof DGSSearchableTableSchema> & {
    site: IsomerSiteProps
    LinkComponent?: LinkComponentType
  }

export type SearchableTableProps = Static<typeof SearchableTableSchema> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}
