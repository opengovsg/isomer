import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { ARRAY_RADIO_FORMAT } from "../format"
import { DgsDataSourceSchema } from "../integration/dgs"
import { NativeDataSourceSchema } from "../integration/native"

const BaseSearchableTableSchema = Type.Object({
  title: Type.Optional(
    Type.String({
      description: "The title of the table",
      title: "Title",
    }),
  ),
})

const NativeSearchableTableSchema = Type.Intersect(
  [
    NativeDataSourceSchema,
    Type.Object({
      headers: Type.Array(Type.Union([Type.String(), Type.Number()])),
      items: Type.Array(Type.Array(Type.Union([Type.String(), Type.Number()]))),
    }),
  ],
  {
    // currently we don't support this for Studio users
    format: "hidden",
    // NOTE: think of a better title that makes sense for user
    title: "Native",
  },
)

const DGSSearchableTableSchema = Type.Intersect(
  [
    DgsDataSourceSchema,
    Type.Object({
      headers: Type.Optional(
        Type.Array(
          Type.Object({
            key: Type.String({
              description: "Column name in DGS table",
              title: "Key",
            }),
            label: Type.Optional(
              Type.String({
                description: "Rename the column's header",
                title: "Label",
              }),
            ),
          }),
          {
            // don't want to expose this to Studio users yet
            format: "hidden",
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
      format: ARRAY_RADIO_FORMAT,
      title: "Data source",
    }),
  ],
  {
    description: "Displays a table with search and pagination functionality.",
    title: "Database",
  },
)

type BaseSearchableTableClientProps = Static<typeof BaseSearchableTableSchema>

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

export type SearchableTableProps = Static<typeof SearchableTableSchema>
