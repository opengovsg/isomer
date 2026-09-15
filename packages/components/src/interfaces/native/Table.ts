import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import type { DividerProps } from "./Divider"
import type { OrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { UnorderedListProps } from "./UnorderedList"
import { OrderedListSchema } from "./OrderedList"
import { ParagraphSchema } from "./Paragraph"
import { UnorderedListSchema } from "./UnorderedList"

const TableBaseCellSchema = Type.Object({
  colspan: Type.Optional(
    Type.Integer({
      title: "Table cell column span",
      description: "The number of columns the cell spans",
      minimum: 1,
    }),
  ),
  rowspan: Type.Optional(
    Type.Integer({
      title: "Table cell row span",
      description: "The number of rows the cell spans",
      minimum: 1,
    }),
  ),
})

// Disable rule so typescript inference can work properly
// oxlint-disable-next-line @typescript-eslint/consistent-type-definitions
type TableCellProps = {
  type: "tableCell"
  attrs?: Static<typeof TableBaseCellSchema>
  content: (
    | DividerProps
    | Omit<ParagraphProps, "site">
    | Omit<OrderedListProps, "site">
    | Omit<UnorderedListProps, "site">
  )[]
}

// NOTE: The TableCellProps interface and the underlying TableCellSchema needs
// to be in sync with each other. Unsafe is used here to bypass errors in
// TypeScript where the type instantiation is too deep.
const TableCellSchema = Type.Unsafe<TableCellProps>(
  Type.Object({
    type: Type.Literal("tableCell", { default: "tableCell" }),
    attrs: Type.Optional(TableBaseCellSchema),
    content: Type.Array(
      Type.Union([
        Type.Ref(ParagraphSchema),
        Type.Ref(OrderedListSchema),
        Type.Ref(UnorderedListSchema),
      ]),
      {
        title: "Table cell contents",
        description: "The contents of the table cell",
        minItems: 1,
      },
    ),
  }),
)

const TableHeaderCellSchema = Type.Object({
  type: Type.Literal("tableHeader", { default: "tableHeader" }),
  attrs: Type.Optional(TableBaseCellSchema),
  content: Type.Array(Type.Ref(ParagraphSchema), {
    title: "Table header cell contents",
    description: "The contents of the table header cell",
    minItems: 1,
  }),
})

const TableContentRowSchema = Type.Object(
  {
    type: Type.Literal("tableRow", { default: "tableRow" }),
    content: Type.Array(Type.Union([TableCellSchema, TableHeaderCellSchema]), {
      title: "Table cells",
      minItems: 1,
    }),
  },
  {
    title: "Table row",
  },
)

const TableHeaderRowSchema = Type.Object(
  {
    type: Type.Literal("tableRow", { default: "tableRow" }),
    content: Type.Array(TableHeaderCellSchema, {
      title: "Table header cells",
      minItems: 1,
    }),
  },
  {
    title: "Table header row",
  },
)

export const TableSchema = Type.Object(
  {
    type: Type.Literal("table", { default: "table" }),
    attrs: Type.Object({
      caption: Type.String({
        title: "Table caption",
        description: "The caption of the table",
      }),
      // One entry per column, by index -- not a per-cell field, since a
      // column's width belongs to the table, not to any particular cell.
      // Optional (older content predates this field) and nullable as a
      // whole (not yet resized) -- but once populated, every entry is a
      // number: the editor only ever writes a full array or `null`, never a
      // partial one.
      colwidths: Type.Optional(
        Type.Union([
          Type.Array(
            Type.Number({
              minimum: 0,
              maximum: 100,
            }),
            {
              title: "Table column widths",
              description:
                "The width of each column, as a percentage of the table's total width",
            },
          ),
          Type.Null(),
        ]),
      ),
    }),
    content: Type.Array(
      Type.Union([TableHeaderRowSchema, TableContentRowSchema]),
      {
        title: "Table rows",
        minItems: 1,
      },
    ),
  },
  {
    $id: "components-native-table",
    title: "Table component",
  },
)

export type TableProps = Static<typeof TableSchema> & {
  site: IsomerSiteProps
}
