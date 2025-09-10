import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import {
  DATA_SOURCE_TYPE,
  DgsDataSourceSchema,
  NativeDataSourceSchema,
} from "../integration"

export const SEARCHABLE_TABLE_TYPE = "searchabletable"

const BaseSearchableTableSchema = Type.Object({
  type: Type.Literal(SEARCHABLE_TABLE_TYPE, { default: SEARCHABLE_TABLE_TYPE }),
  title: Type.Optional(
    Type.String({
      title: "Title",
      description: "The title of the table",
    }),
  ),
})

export const NativeSearchableTableSchema = Type.Intersect(
  [
    NativeDataSourceSchema,
    Type.Object({
      headers: Type.Array(Type.Union([Type.String(), Type.Number()])),
      items: Type.Array(Type.Array(Type.Union([Type.String(), Type.Number()]))),
    }),
  ],
  {
    title: "Native", // TODO: think of a better title that makes sense for user
  },
)

export const DGSSearchableTableSchema = Type.Intersect(
  [
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
  ],
  {
    title: "DGS (data.gov.sg)",
  },
)

export const SearchableTableSchema = Type.Intersect([
  BaseSearchableTableSchema,
  Type.Union([NativeSearchableTableSchema, DGSSearchableTableSchema], {
    title: "Data source",
  }),
])

type BaseSearchableTableClientProps = Static<
  typeof BaseSearchableTableSchema
> & {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

// note: ideally we should not pass entire "site" object to the client component
// as it can be quite large and increase page size
// but since this is not a common component, we will allow it for now :(
export type SearchableTableClientProps = BaseSearchableTableClientProps &
  Pick<NativeSearchableTableProps, "headers"> & {
    items: {
      row: NativeSearchableTableProps["items"][number]
      key: string
    }[]
  } & {
    isLoading?: boolean
    isError?: boolean
  }

export type NativeSearchableTableProps = BaseSearchableTableClientProps &
  Static<typeof NativeSearchableTableSchema>

export type DGSSearchableTableProps = BaseSearchableTableClientProps &
  Static<typeof DGSSearchableTableSchema>

export type SearchableTableProps = Pick<
  BaseSearchableTableClientProps,
  "site" | "LinkComponent"
> &
  Static<typeof SearchableTableSchema>
