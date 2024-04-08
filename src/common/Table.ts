import type ImageProps from "./Image"
import type OrderedListProps from "./OrderedList"
import type UnorderedListProps from "./UnorderedList"

interface TableBaseCell {
  value: (string | ImageProps | OrderedListProps | UnorderedListProps)[]
  colSpan?: number
  rowSpan?: number
}

interface TableCell extends TableBaseCell {
  type: "tableCell"
}

interface TableHeaderCell extends TableBaseCell {
  type: "tableHeader"
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
  items: [TableHeaderRow, ...(TableHeaderRow | TableContentRow)[]]
  LinkComponent?: any // Next.js link
}

export default TableProps
