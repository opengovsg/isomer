import type { Editor } from "@tiptap/react"
import type { RefObject } from "react"
import { Plugin } from "@tiptap/pm/state"
import { useEditorState } from "@tiptap/react"
import { useLayoutEffect } from "react"

import {
  buildColgroupSpec,
  getColumnCount,
  getEqualColumnWidths,
  resolveColumnWidths,
} from "./tableColumnWidths"

interface IsomerTableEditorStorage {
  columnResizeDragCount?: number
}

const getIsomerTableStorage = (editor: Editor): IsomerTableEditorStorage => {
  const root = editor.storage as { table?: IsomerTableEditorStorage }
  root.table ??= createInitialTableColumnResizeStorage()
  return root.table
}

export const isTableColumnResizeDragging = (editor: Editor): boolean =>
  (getIsomerTableStorage(editor).columnResizeDragCount ?? 0) > 0

export const beginTableColumnResizeDrag = (editor: Editor): void => {
  const storage = getIsomerTableStorage(editor)
  storage.columnResizeDragCount = (storage.columnResizeDragCount ?? 0) + 1
}

export const endTableColumnResizeDrag = (editor: Editor): void => {
  const storage = getIsomerTableStorage(editor)
  storage.columnResizeDragCount = Math.max(
    0,
    (storage.columnResizeDragCount ?? 0) - 1,
  )
}

export const createInitialTableColumnResizeStorage = () => ({
  columnResizeDragCount: 0,
})

// After a column add/remove, colwidths may be the wrong length. Rebalance to an
// equal split. Skip tables that still have colwidths: null.
export const tableColumnWidthNormalizerPlugin = () =>
  new Plugin({
    appendTransaction(transactions, _oldState, newState) {
      if (!transactions.some((transaction) => transaction.docChanged)) {
        return null
      }

      let tr = newState.tr
      let changed = false

      newState.doc.descendants((node, pos) => {
        if (node.type.name !== "table") {
          return true
        }

        const colwidths = node.attrs.colwidths as number[] | null
        if (!colwidths) {
          return false
        }

        const columnCount = getColumnCount(node)
        if (colwidths.length !== columnCount) {
          tr = tr.setNodeMarkup(pos, null, {
            ...node.attrs,
            colwidths: getEqualColumnWidths(columnCount),
          })
          changed = true
        }

        return false
      })

      return changed ? tr : null
    },
  })

export const applyColumnWidths = (
  table: HTMLTableElement,
  columnWidths: number[],
) => {
  const { tableLayout, columnWidths: widthStyles } =
    buildColgroupSpec(columnWidths)

  table.style.width = "100%"
  table.style.tableLayout = tableLayout

  let colgroup = table.querySelector("colgroup")
  if (!colgroup) {
    colgroup = document.createElement("colgroup")
    table.prepend(colgroup)
  }

  const cols = colgroup.children
  if (cols.length !== widthStyles.length) {
    colgroup.replaceChildren(
      ...widthStyles.map((width) => {
        const col = document.createElement("col")
        col.style.width = width
        return col
      }),
    )
    return
  }

  widthStyles.forEach((width, index) => {
    const col = cols.item(index)
    if (col instanceof HTMLElement) {
      col.style.width = width
    }
  })
}

export const resolveTableElement = (
  overlayRoot: HTMLDivElement | null,
  tableRef: RefObject<HTMLTableElement | null>,
): HTMLTableElement | null => {
  const sibling = overlayRoot?.previousElementSibling
  return sibling instanceof HTMLTableElement ? sibling : tableRef.current
}

interface UseTableLayoutSyncOptions {
  editor: Editor
  getPos: () => number | undefined
  tableRef: RefObject<HTMLTableElement | null>
  overlayRootRef: RefObject<HTMLDivElement | null>
}

export const useTableLayoutSync = ({
  editor,
  getPos,
  tableRef,
  overlayRootRef,
}: UseTableLayoutSyncOptions): number[] => {
  const liveWidths = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const tablePos = getPos()
      if (tablePos == null) {
        return []
      }
      const node = current.state.doc.nodeAt(tablePos)
      if (!node || node.type.name !== "table") {
        return []
      }
      return resolveColumnWidths(node.attrs.colwidths, getColumnCount(node))
    },
    equalityFn: (left, right) =>
      right != null &&
      left.length === right.length &&
      left.every((width, index) => width === right[index]),
  })

  useLayoutEffect(() => {
    if (isTableColumnResizeDragging(editor)) {
      return
    }

    const table = resolveTableElement(overlayRootRef.current, tableRef)
    if (table) {
      applyColumnWidths(table, liveWidths)
    }

    if (!table) {
      return
    }

    const observer = new MutationObserver(() => {
      if (isTableColumnResizeDragging(editor)) {
        return
      }
      applyColumnWidths(table, liveWidths)
    })
    observer.observe(table, { childList: true })
    return () => observer.disconnect()
  }, [editor, liveWidths, overlayRootRef, tableRef])

  return liveWidths
}
