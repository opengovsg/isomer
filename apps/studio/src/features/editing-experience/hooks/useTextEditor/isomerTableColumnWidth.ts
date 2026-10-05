import type { Command, Editor, RawCommands } from "@tiptap/core"
import {
  addColumnAfter,
  addColumnBefore,
  deleteColumn,
  selectedRect,
} from "@tiptap/pm/tables"

import {
  resetTableColumnWidths,
  setTableColumnWidthsOnTransaction,
  syncTableColumnWidthsAfterAdd,
  syncTableColumnWidthsAfterDelete,
} from "~/features/editing-experience/utils/tableColumnWidthSync"

export const tableColumnWidthsAttribute = {
  default: null as number[] | null,
  parseHTML: (element: HTMLElement) => {
    const raw = element.getAttribute("data-column-widths")
    if (!raw) return null
    try {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  },
  renderHTML: (attributes: Record<string, unknown>) => {
    if (!Array.isArray(attributes.columnWidths)) return {}
    return {
      "data-column-widths": JSON.stringify(attributes.columnWidths),
    }
  },
}

type ParentCommands = Partial<RawCommands> | undefined

const runWithColumnSync = (
  run: Command,
  sync: (args: {
    tr: import("@tiptap/pm/state").Transaction
    tablePos: number
    index: number
  }) => import("@tiptap/pm/state").Transaction,
  getIndex: (rect: ReturnType<typeof selectedRect>) => number,
): Command => {
  return (props) => {
    const rect = selectedRect(props.state)
    const tablePos = rect.tableStart - 1
    const index = getIndex(rect)
    let transaction = props.state.tr
    const ran = run(props.state, (tr) => {
      transaction = sync({ tr, tablePos, index })
      return true
    })
    if (!ran) return false
    props.dispatch?.(transaction)
    return true
  }
}

export const extendIsomerTableColumnWidthCommands = (
  parent: ParentCommands,
): Partial<RawCommands> => ({
  ...parent,
  addColumnBefore:
    () =>
    (props) =>
      runWithColumnSync(
        addColumnBefore,
        syncTableColumnWidthsAfterAdd,
        (rect) => rect.left,
      )(props),
  addColumnAfter:
    () =>
    (props) =>
      runWithColumnSync(
        addColumnAfter,
        syncTableColumnWidthsAfterAdd,
        (rect) => rect.right,
      )(props),
  deleteColumn:
    () =>
    (props) =>
      runWithColumnSync(
        deleteColumn,
        syncTableColumnWidthsAfterDelete,
        (rect) => rect.left,
      )(props),
  setTableColumnWidths:
    (columnWidths: number[]) =>
    ({ state, dispatch }) => {
      const rect = selectedRect(state)
      const tablePos = rect.tableStart - 1
      if (!dispatch) return true
      dispatch(
        setTableColumnWidthsOnTransaction({
          tr: state.tr,
          tablePos,
          columnWidths,
        }),
      )
      return true
    },
  setTableColumnWidthsAt:
    (tablePos: number, columnWidths: number[]) =>
    ({ state, dispatch }) => {
      if (!dispatch) return true
      dispatch(
        setTableColumnWidthsOnTransaction({
          tr: state.tr,
          tablePos,
          columnWidths,
        }),
      )
      return true
    },
  resetTableColumnWidths:
    () =>
    ({ state, dispatch }) => {
      const rect = selectedRect(state)
      const tablePos = rect.tableStart - 1
      const table = state.doc.nodeAt(tablePos)
      if (!table?.attrs.columnWidths) return false
      if (!dispatch) return true
      dispatch(resetTableColumnWidths({ tr: state.tr, tablePos }))
      return true
    },
})

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    isomerTableColumnWidths: {
      setTableColumnWidths: (columnWidths: number[]) => ReturnType
      setTableColumnWidthsAt: (
        tablePos: number,
        columnWidths: number[],
      ) => ReturnType
      resetTableColumnWidths: () => ReturnType
    }
  }
}

export const tableHasStoredColumnWidths = (editor: Editor): boolean => {
  const rect = selectedRect(editor.state)
  const table = editor.state.doc.nodeAt(rect.tableStart - 1)
  return Array.isArray(table?.attrs.columnWidths)
}
