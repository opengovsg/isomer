import type { EditorState, Selection } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import { autoUpdate } from "@floating-ui/dom"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"
import { useEffect, useRef, useState } from "react"

import type { TableBubbleMenuAnchor } from "./TableBubbleMenu.types"

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

const getAnchorRect = (anchor?: TableBubbleMenuAnchor): DOMRect | null => {
  const virtualElement = anchor?.getReferencedVirtualElement()
  if (!virtualElement) return null
  const rect = virtualElement.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return rect
}

const getReferenceRect = (
  view: EditorView,
  state: EditorState,
  anchor?: TableBubbleMenuAnchor,
): DOMRect | null =>
  getAnchorRect(anchor) ?? getBottomRightCellRect(view, state)

const computeMenuPosition = (
  referenceRect: DOMRect,
  menuEl: HTMLElement,
  anchor?: TableBubbleMenuAnchor,
): TableBubbleMenuPosition | null => {
  const triggerEl = menuEl.querySelector("[data-table-bubble-menu-trigger]")
  if (!(triggerEl instanceof HTMLElement)) return null

  const { offsetWidth: triggerWidth, offsetHeight: triggerHeight } = triggerEl
  const anchorRect = getAnchorRect(anchor)

  if (anchorRect) {
    return {
      x: anchorRect.right - triggerWidth / 2 - triggerEl.offsetLeft,
      y: anchorRect.bottom + 4 - triggerEl.offsetTop,
    }
  }

  return {
    x: referenceRect.right - triggerWidth / 2 - triggerEl.offsetLeft,
    y: referenceRect.bottom - triggerHeight / 2 - triggerEl.offsetTop,
  }
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

const createVirtualReference = (
  getView: () => EditorView,
  getState: () => EditorState,
  anchor?: TableBubbleMenuAnchor,
) => {
  const virtualReference = {
    getBoundingClientRect: () => {
      const rect = getReferenceRect(getView(), getState(), anchor)
      if (!rect) return new DOMRect()
      if (getAnchorRect(anchor)) {
        return new DOMRect(rect.left, rect.top, rect.width, rect.height)
      }
      return new DOMRect(rect.right, rect.bottom, 0, 0)
    },
    getClientRects: () => [virtualReference.getBoundingClientRect()],
  }

  return virtualReference
}

const createPositionUpdater = (
  getView: () => EditorView,
  getState: () => EditorState,
  menuEl: HTMLElement,
  onPosition: (position: TableBubbleMenuPosition) => void,
  anchor?: TableBubbleMenuAnchor,
): (() => void) => {
  return () => {
    const referenceRect = getReferenceRect(getView(), getState(), anchor)
    if (!referenceRect) return

    const nextPosition = computeMenuPosition(referenceRect, menuEl, anchor)
    if (nextPosition) {
      onPosition(nextPosition)
    }
  }
}

// autoUpdate does not track nested editor scroll containers.
const attachScrollListeners = (
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
  anchor?: TableBubbleMenuAnchor
}

export const useTableBubbleMenuPosition = ({
  editor,
  menuEl,
  show,
  selection,
  anchor,
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
      return
    }

    const getView = () => editorRef.current.view
    const getState = () => editorRef.current.state
    const virtualReference = createVirtualReference(getView, getState, anchor)
    const updatePosition = createPositionUpdater(
      getView,
      getState,
      menuEl,
      setPosition,
      anchor,
    )

    updatePosition()

    const stopAutoUpdate = autoUpdate(virtualReference, menuEl, updatePosition)
    const detachScrollListeners = attachScrollListeners(
      getView(),
      updatePosition,
    )

    return () => {
      stopAutoUpdate()
      detachScrollListeners()
    }
  }, [show, selection, menuEl, anchor])

  return position
}
