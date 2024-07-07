import { Type, type Static } from "@sinclair/typebox"
import { DividerSchema } from "./Divider"
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

const TableCellSchema = Type.Object({
  type: Type.Literal("tableCell"),
  attrs: Type.Optional(TableBaseCellSchema),
  content: Type.Array(
    Type.Union([
      Type.Ref(DividerSchema),
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
})

const TableHeaderCellSchema = Type.Object({
  type: Type.Literal("tableHeader"),
  attrs: Type.Optional(TableBaseCellSchema),
  content: Type.Array(Type.Ref(ParagraphSchema), {
    title: "Table header cell contents",
    description: "The contents of the table header cell",
    minItems: 1,
  }),
})

const TableContentRowSchema = Type.Object(
  {
    type: Type.Literal("tableRow"),
    content: Type.Array(TableCellSchema, {
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
    type: Type.Literal("tableRow"),
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
    type: Type.Literal("table"),
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
    title: "Table component",
  },
)

export type TableProps = Static<typeof TableSchema>
