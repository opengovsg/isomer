import type { EditorState, Selection } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import { autoUpdate } from "@floating-ui/dom"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"
import { useEffect, useRef, useState } from "react"

interface TableBubbleMenuPosition {
  x: number
  y: number
}

const getEditorScrollParent = (view: EditorView): HTMLElement | Window => {
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

// Document position of the bottom-right perimeter cell in a CellSelection
// (anchors the table action trigger).
const getBottomRightCellDocumentPos = (state: EditorState): number | null => {
  const { selection } = state
  if (!(selection instanceof CellSelection)) return null

  const rect = selectedRect(state)
  let bottomRightPos: number | null = null

  selection.forEachCell((node, pos) => {
    const cellRect = rect.map.findCell(pos - rect.tableStart)
    if (cellRect.right === rect.right && cellRect.bottom === rect.bottom) {
      bottomRightPos = pos
    }
  })

  return bottomRightPos
}

const getBottomRightCellRect = (
  view: EditorView,
  state: EditorState,
): DOMRect | null => {
  const cellPos = getBottomRightCellDocumentPos(state)
  if (cellPos === null) return null

  const dom = view.nodeDOM(cellPos)
  if (!(dom instanceof HTMLElement)) return null

  return dom.getBoundingClientRect()
}

// Positions the menu container so the pencil trigger's center sits on the
// bottom-right corner of the selected cell block.
const computeTableBubbleMenuContainerPosition = (
  cellRect: DOMRect,
  menuEl: HTMLElement,
): TableBubbleMenuPosition | null => {
  const triggerEl = menuEl.querySelector("[data-table-bubble-menu-trigger]")
  if (!(triggerEl instanceof HTMLElement)) return null

  const { offsetWidth: triggerWidth, offsetHeight: triggerHeight } = triggerEl

  return {
    x: cellRect.right - triggerWidth / 2 - triggerEl.offsetLeft,
    y: cellRect.bottom - triggerHeight / 2 - triggerEl.offsetTop,
  }
}

// Point anchor for Floating UI autoUpdate scroll/resize detection.
const createTableBubbleMenuVirtualReference = (
  getView: () => EditorView,
  getState: () => EditorState,
) => {
  const virtualReference = {
    getBoundingClientRect: () => {
      const rect = getBottomRightCellRect(getView(), getState())
      if (!rect) return new DOMRect()
      return new DOMRect(rect.right, rect.bottom, 0, 0)
    },
    getClientRects: () => [virtualReference.getBoundingClientRect()],
  }

  return virtualReference
}

// Updates the menu position when the selected cell block changes.
const createTableBubbleMenuPositionUpdater = (
  getView: () => EditorView,
  getState: () => EditorState,
  menuEl: HTMLElement,
  onPosition: (position: TableBubbleMenuPosition) => void,
): (() => void) => {
  return () => {
    const cellRect = getBottomRightCellRect(getView(), getState())
    if (!cellRect) return

    const nextPosition = computeTableBubbleMenuContainerPosition(
      cellRect,
      menuEl,
    )
    if (nextPosition) {
      onPosition(nextPosition)
    }
  }
}

// autoUpdate does not always track nested editor scroll containers.
const attachTableBubbleMenuScrollListeners = (
  view: EditorView,
  onUpdate: () => void,
): (() => void) => {
  const scrollTarget = getEditorScrollParent(view)

  if (scrollTarget instanceof HTMLElement) {
    scrollTarget.addEventListener("scroll", onUpdate, { passive: true })
  }
  window.addEventListener("resize", onUpdate, { passive: true })

  return () => {
    if (scrollTarget instanceof HTMLElement) {
      scrollTarget.removeEventListener("scroll", onUpdate)
    }
    window.removeEventListener("resize", onUpdate)
  }
}

interface UseTableBubbleMenuPositionOptions {
  editor: Editor
  menuEl: HTMLDivElement | null
  show: boolean
  selection: Selection
}

// Anchors the menu to the bottom-right of the selected cell block and keeps
// position in sync on scroll, resize, and selection changes.
export const useTableBubbleMenuPosition = ({
  editor,
  menuEl,
  show,
  selection,
}: UseTableBubbleMenuPositionOptions): TableBubbleMenuPosition | null => {
  const editorRef = useRef(editor)
  editorRef.current = editor

  const [position, setPosition] = useState<TableBubbleMenuPosition | null>(null)

  useEffect(() => {
    if (!show) {
      setPosition(null)
      return
    }

    if (!menuEl) {
      // Portal may not have mounted yet; menuEl state update will retry.
      return
    }

    const getView = () => editorRef.current.view
    const getState = () => editorRef.current.state
    const virtualReference = createTableBubbleMenuVirtualReference(
      getView,
      getState,
    )
    const updatePosition = createTableBubbleMenuPositionUpdater(
      getView,
      getState,
      menuEl,
      setPosition,
    )

    updatePosition()

    const stopAutoUpdate = autoUpdate(virtualReference, menuEl, updatePosition)
    const detachScrollListeners = attachTableBubbleMenuScrollListeners(
      getView(),
      updatePosition,
    )

    return () => {
      stopAutoUpdate()
      detachScrollListeners()
    }
  }, [show, selection, menuEl])

  return position
}
