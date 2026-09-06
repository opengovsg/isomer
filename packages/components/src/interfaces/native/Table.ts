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
      description: "The number of columns the cell spans",
      minimum: 1,
      title: "Table cell column span",
    }),
  ),
  rowspan: Type.Optional(
    Type.Integer({
      description: "The number of rows the cell spans",
      minimum: 1,
      title: "Table cell row span",
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
    attrs: Type.Optional(TableBaseCellSchema),
    content: Type.Array(
      Type.Union([
        Type.Ref(ParagraphSchema),
        Type.Ref(OrderedListSchema),
        Type.Ref(UnorderedListSchema),
      ]),
      {
        description: "The contents of the table cell",
        minItems: 1,
        title: "Table cell contents",
      },
    ),
    type: Type.Literal("tableCell", { default: "tableCell" }),
  }),
)

const TableHeaderCellSchema = Type.Object({
  attrs: Type.Optional(TableBaseCellSchema),
  content: Type.Array(Type.Ref(ParagraphSchema), {
    description: "The contents of the table header cell",
    minItems: 1,
    title: "Table header cell contents",
  }),
  type: Type.Literal("tableHeader", { default: "tableHeader" }),
})

const TableContentRowSchema = Type.Object(
  {
    content: Type.Array(Type.Union([TableCellSchema, TableHeaderCellSchema]), {
      minItems: 1,
      title: "Table cells",
    }),
    type: Type.Literal("tableRow", { default: "tableRow" }),
  },
  {
    title: "Table row",
  },
)

const TableHeaderRowSchema = Type.Object(
  {
    content: Type.Array(TableHeaderCellSchema, {
      minItems: 1,
      title: "Table header cells",
    }),
    type: Type.Literal("tableRow", { default: "tableRow" }),
  },
  {
    title: "Table header row",
  },
)

export const TableSchema = Type.Object(
  {
    attrs: Type.Object({
      caption: Type.String({
        description: "The caption of the table",
        title: "Table caption",
      }),
    }),
    content: Type.Array(
      Type.Union([TableHeaderRowSchema, TableContentRowSchema]),
      {
        minItems: 1,
        title: "Table rows",
      },
    ),
    type: Type.Literal("table", { default: "table" }),
  },
  {
    $id: "components-native-table",
    title: "Table component",
  },
)

export type TableProps = Static<typeof TableSchema> & {
  site: IsomerSiteProps
}
