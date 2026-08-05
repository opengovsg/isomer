import type { EditorState } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import { useEffect, useState } from "react"

import { getBottomRightCellDocumentPos } from "./TableBubbleMenu.utils"

export interface TableBubbleMenuCorner {
  x: number
  y: number
}

export const getEditorScrollParent = (
  view: EditorView,
): HTMLElement | Window => {
  let element: HTMLElement | null = view.dom.parentElement
  while (element) {
    const { overflowY } = getComputedStyle(element)
    if (overflowY === "auto" || overflowY === "scroll") {
      return element
    }
    element = element.parentElement
  }
  return window
}

export const getBottomRightCellRect = (
  view: EditorView,
  state: EditorState,
): DOMRect | null => {
  const cellPos = getBottomRightCellDocumentPos(state)
  if (cellPos === null) return null

  const dom = view.nodeDOM(cellPos)
  if (!(dom instanceof HTMLElement)) return null

  return dom.getBoundingClientRect()
}

// Tracks the screen-space bottom-right corner of the current CellSelection.
// Listens to the editor's scroll parent (not just window) so the trigger stays
// glued to the table while the content area scrolls.
export const useTableBubbleMenuTriggerCorner = (
  editor: Editor,
  enabled: boolean,
): TableBubbleMenuCorner | null => {
  const [corner, setCorner] = useState<TableBubbleMenuCorner | null>(null)

  useEffect(() => {
    if (!enabled) {
      setCorner(null)
      return
    }

    let rafId = 0
    let cancelled = false

    const updateCorner = () => {
      rafId = 0
      if (cancelled || editor.isDestroyed) return

      const rect = getBottomRightCellRect(editor.view, editor.state)
      if (!rect) {
        setCorner(null)
        return
      }
      setCorner({ x: rect.right, y: rect.bottom })
    }

    const scheduleUpdate = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(updateCorner)
    }

    scheduleUpdate()

    const scrollTarget = getEditorScrollParent(editor.view)
    scrollTarget.addEventListener("scroll", scheduleUpdate, { passive: true })
    window.addEventListener("resize", scheduleUpdate, { passive: true })
    editor.on("selectionUpdate", scheduleUpdate)
    editor.on("transaction", scheduleUpdate)
    editor.on("focus", scheduleUpdate)

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      scrollTarget.removeEventListener("scroll", scheduleUpdate)
      window.removeEventListener("resize", scheduleUpdate)
      editor.off("selectionUpdate", scheduleUpdate)
      editor.off("transaction", scheduleUpdate)
      editor.off("focus", scheduleUpdate)
    }
  }, [editor, enabled])

  return corner
}
