import type { VirtualElement } from "@floating-ui/dom"
import type { EditorState } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import { CellSelection, selectedRect } from "@tiptap/pm/tables"

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

export const createBottomRightVirtualElement = (
  view: EditorView,
  state: EditorState,
): VirtualElement | null => {
  const cellRect = getBottomRightCellRect(view, state)
  if (!cellRect) return null

  const virtualElement: VirtualElement = {
    getBoundingClientRect: () =>
      new DOMRect(cellRect.right, cellRect.bottom, 0, 0),
    getClientRects: () => [virtualElement.getBoundingClientRect()],
  }

  return virtualElement
}
