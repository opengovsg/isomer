import type ImageProps from "./Image"
import type OrderedListProps from "./OrderedList"
import type UnorderedListProps from "./UnorderedList"

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

export default TableProps
