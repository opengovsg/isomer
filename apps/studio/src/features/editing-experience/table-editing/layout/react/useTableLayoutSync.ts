import type { Editor } from "@tiptap/react"
import type { RefObject } from "react"
import { resolveColumnWidths } from "@opengovsg/isomer-components"
import { useEditorState } from "@tiptap/react"
import { useLayoutEffect } from "react"

import { applyColgroupSpec } from "../dom/applyColgroupSpec"
import { resolveTableElement } from "../dom/resolveTableElement"
import { getColumnCount } from "../domain/columnCount"
import { isTableColumnResizeDragging } from "../pm/columnResizeDragStorage"

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
      applyColgroupSpec(table, liveWidths)
    }

    if (!table) {
      return
    }

    const observer = new MutationObserver(() => {
      if (isTableColumnResizeDragging(editor)) {
        return
      }
      applyColgroupSpec(table, liveWidths)
    })
    observer.observe(table, { childList: true })
    return () => observer.disconnect()
  }, [editor, liveWidths, overlayRootRef, tableRef])

  return liveWidths
}
