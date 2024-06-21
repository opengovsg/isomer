import type {
  DividerProps,
  ImageProps,
  OrderedListProps,
  ParagraphProps,
  UnorderedListProps,
} from "~/interfaces"

interface TableBaseCell {
  colSpan?: number
  rowSpan?: number
}

interface TableCell extends TableBaseCell {
  type: "tableCell"
  content: (
    | DividerProps
    | ParagraphProps
    | ImageProps
    | OrderedListProps
    | UnorderedListProps
  )[]
}

interface TableHeaderCell extends TableBaseCell {
  type: "tableHeader"
  content: [ParagraphProps]
}
interface TableContentRow {
  type: "tableRow"
  content: [TableCell, ...TableCell[]]
}

interface TableHeaderRow {
  type: "tableRow"
  content: [TableHeaderCell, ...TableHeaderCell[]]
}

export interface TableProps {
  type: "table"
  caption: string
  content: [TableHeaderRow, ...(TableHeaderRow | TableContentRow)[]]
}
