import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { DividerProps } from "./Divider"
import type { OrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { UnorderedListProps } from "./UnorderedList"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
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
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type TableCellProps = {
  type: "tableCell"
  attrs?: Static<typeof TableBaseCellSchema>
  content: (
    | DividerProps
    | Omit<ParagraphProps, "LinkComponent" | "site">
    | Omit<OrderedListProps, "LinkComponent" | "site">
    | Omit<UnorderedListProps, "LinkComponent" | "site">
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
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
