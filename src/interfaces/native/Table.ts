import type {
  ImageProps,
  OrderedListProps,
  UnorderedListProps,
} from "~/interfaces/native"

interface TableBaseCell {
  colSpan?: number
  rowSpan?: number
}

interface TableCell extends TableBaseCell {
  variant: "tableCell"
  value: (string | ImageProps | OrderedListProps | UnorderedListProps)[]
}

interface TableHeaderCell extends TableBaseCell {
  variant: "tableHeader"
  value: string
}
interface TableContentRow {
  cells: [TableCell, ...TableCell[]]
}

interface TableHeaderRow {
  cells: [TableHeaderCell, ...TableHeaderCell[]]
}

export interface TableProps {
  type: "table"
  caption: string
  rows: [TableHeaderRow, ...(TableHeaderRow | TableContentRow)[]]
}
