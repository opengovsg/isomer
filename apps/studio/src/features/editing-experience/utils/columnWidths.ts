import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Command, EditorState, Transaction } from "@tiptap/pm/state"
import {
  TABLE_COLUMN_DEFAULT_WIDTH_PX,
  clampTableColumnWidth,
  parseTableColumnWidths,
} from "@opengovsg/isomer-components"
import {
  isInTable,
  moveTableColumn,
  selectedRect,
  TableMap,
} from "@tiptap/pm/tables"

type ColumnRect = ReturnType<typeof selectedRect>

export const storedColumnWidths = (
  table: ProseMirrorNode,
  columnCount: number,
): number[] | null =>
  parseTableColumnWidths(table.attrs.columnWidths, columnCount)

export const insertColumnWidth = (
  widths: number[],
  index: number,
  width = TABLE_COLUMN_DEFAULT_WIDTH_PX,
): number[] => {
  const next = widths.slice()
  next.splice(index, 0, width)
  return next
}

export const removeColumnWidths = (
  widths: number[],
  from: number,
  to: number,
): number[] => widths.filter((_, index) => index < from || index >= to)

/** Same index move as prosemirror-tables `moveTableColumn` for a single column. */
export const moveColumnWidth = (
  widths: number[],
  from: number,
  to: number,
): number[] => {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= widths.length ||
    to >= widths.length
  ) {
    return widths
  }
  const next = widths.slice()
  const [width] = next.splice(from, 1)
  next.splice(to, 0, width ?? TABLE_COLUMN_DEFAULT_WIDTH_PX)
  return next
}

export const duplicateColumnWidths = (
  widths: number[],
  left: number,
  right: number,
): number[] => {
  const next = widths.slice()
  next.splice(right, 0, ...widths.slice(left, right))
  return next
}

export const setTableColumnWidths = (
  tr: Transaction,
  tablePos: number,
  columnWidths: number[] | null,
): void => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table || table.type.name !== "table") return
  const parsed =
    columnWidths === null
      ? null
      : parseTableColumnWidths(columnWidths, TableMap.get(table).width)
  tr.setNodeMarkup(tablePos, undefined, {
    ...table.attrs,
    columnWidths: parsed,
  })
}

export type WidthCommand = (props: {
  state: EditorState
  dispatch?: ((tr: Transaction) => void) | undefined
}) => boolean

export const withStoredColumnWidths = (
  command: WidthCommand | undefined,
  change: (widths: number[], rect: ColumnRect) => number[],
): WidthCommand => {
  return (props) => {
    if (!command) return false
    const dispatch = props.dispatch
    if (!dispatch || !isInTable(props.state)) return command(props)

    const rect = selectedRect(props.state)
    const widths = storedColumnWidths(rect.table, rect.map.width)
    return command({
      ...props,
      dispatch: (tr) => {
        if (widths) {
          setTableColumnWidths(tr, rect.tableStart - 1, change(widths, rect))
        }
        dispatch(tr)
      },
    })
  }
}

export const moveTableColumnWithWidths = ({
  from,
  to,
  pos,
  tablePos,
  select,
}: {
  from: number
  to: number
  pos: number
  tablePos: number
  select?: boolean
}): Command => {
  return (state, dispatch) => {
    const table = state.doc.nodeAt(tablePos)
    const widths =
      table && table.type.name === "table"
        ? storedColumnWidths(table, TableMap.get(table).width)
        : null

    return moveTableColumn({ from, to, pos, select })(
      state,
      dispatch &&
        ((tr) => {
          if (widths) {
            setTableColumnWidths(
              tr,
              tablePos,
              moveColumnWidth(widths, from, to),
            )
          }
          dispatch(tr)
        }),
    )
  }
}

/** First row only. Colspan cells split their width evenly across spanned columns. */
export const measureColumnWidths = (
  table: HTMLTableElement,
  columnCount: number,
): number[] => {
  const widths = Array.from({ length: columnCount }, () => 0)
  const row = table.rows[0]
  const fallback = clampTableColumnWidth(
    columnCount > 0 ? table.getBoundingClientRect().width / columnCount : 0,
  )
  if (!row) return widths.map(() => fallback)

  let col = 0
  for (const cell of Array.from(row.cells)) {
    const span = cell.colSpan || 1
    const share = cell.getBoundingClientRect().width / span
    for (let i = 0; i < span && col < columnCount; i += 1) {
      widths[col] = clampTableColumnWidth(share)
      col += 1
    }
  }
  return widths.map((width) => (width > 0 ? width : fallback))
}
