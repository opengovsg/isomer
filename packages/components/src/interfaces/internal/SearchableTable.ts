import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { LinkComponentType } from "~/types"
import { ARRAY_RADIO_FORMAT } from "../format"
import { DgsDataSourceSchema, NativeDataSourceSchema } from "../integration"

const BaseSearchableTableSchema = Type.Object({
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
    format: "hidden", // currently we don't support this for Studio users
  },
)

export const DGSSearchableTableSchema = Type.Intersect(
  [
    DgsDataSourceSchema,
    Type.Object({
      headers: Type.Optional(
        Type.Array(
          Type.Object({
            key: Type.String({
              title: "Key",
              description: "Column name in DGS table",
            }),
            label: Type.Optional(
              Type.String({
                title: "Label",
                description: "Rename the column's header",
              }),
            ),
          }),
          {
            format: "hidden", // don't want to expose this to Studio users yet
          },
        ),
      ),
    }),
  ],
  {
    title: "DGS (data.gov.sg)",
  },
)

export const SearchableTableSchema = Type.Intersect(
  [
    BaseSearchableTableSchema,
    Type.Union([NativeSearchableTableSchema, DGSSearchableTableSchema], {
      title: "Data source",
      format: ARRAY_RADIO_FORMAT,
    }),
  ],
  {
    title: "Database",
    description: "Displays a table with search and pagination functionality.",
  },
)

type BaseSearchableTableClientProps = Static<
  typeof BaseSearchableTableSchema
> & {
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
  "LinkComponent"
> &
  Static<typeof SearchableTableSchema>
