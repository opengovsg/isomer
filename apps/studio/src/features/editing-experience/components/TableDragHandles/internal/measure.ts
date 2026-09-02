/**
 * Reads table geometry out of a live editor: finds every table, measures its
 * rows and columns, and converts between viewport and container coordinates.
 *
 * This is the only part of the module that needs a real DOM — the rules
 * computed from what it produces live in `axisMath.ts`.
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { TableMap } from "@tiptap/pm/tables"

import type { Rect, TableGeometry } from "./axisMath"

export interface TableLocation {
  pos: number
  node: ProseMirrorNode
}

interface ContainerOffset {
  containerRect: Pick<DOMRect, "top" | "left">
  scrollTop: number
  scrollLeft: number
}

const viewportRectToContainerRect = ({
  rect,
  containerRect,
  scrollTop,
  scrollLeft,
}: ContainerOffset & { rect: Rect }): Rect => ({
  top: rect.top - containerRect.top + scrollTop,
  left: rect.left - containerRect.left + scrollLeft,
  width: rect.width,
  height: rect.height,
})

export const containerRectToViewportRect = ({
  rect,
  containerRect,
  scrollTop,
  scrollLeft,
}: ContainerOffset & { rect: Rect }): Rect => ({
  top: rect.top + containerRect.top - scrollTop,
  left: rect.left + containerRect.left - scrollLeft,
  width: rect.width,
  height: rect.height,
})

export const viewportPointToContainerPoint = ({
  clientX,
  clientY,
  containerRect,
  scrollTop,
  scrollLeft,
}: ContainerOffset & {
  clientX: number
  clientY: number
}): { x: number; y: number } => ({
  x: clientX - containerRect.left + scrollLeft,
  y: clientY - containerRect.top + scrollTop,
})

export const findAllTables = (editor: TiptapEditor): TableLocation[] => {
  const tables: TableLocation[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "table") {
      tables.push({ pos, node })
      return false
    }
    return true
  })
  return tables
}

const getCellDom = (
  editor: TiptapEditor,
  tablePos: number,
  map: TableMap,
  row: number,
  col: number,
): HTMLElement | null => {
  const cellStart = map.map[row * map.width + col]
  if (cellStart === undefined) return null
  const dom = editor.view.nodeDOM(tablePos + 1 + cellStart)
  return dom instanceof HTMLElement ? dom : null
}

const getRowDom = (
  editor: TiptapEditor,
  tablePos: number,
  map: TableMap,
  row: number,
): HTMLElement | null =>
  getCellDom(editor, tablePos, map, row, 0)?.closest("tr") ?? null

export const measureTableGeometry = (
  editor: TiptapEditor,
  table: TableLocation,
  container: HTMLElement,
  containerRect: DOMRect,
): TableGeometry => {
  const map = TableMap.get(table.node)
  const toContainerRect = (dom: HTMLElement | null): Rect | null =>
    dom
      ? viewportRectToContainerRect({
          rect: dom.getBoundingClientRect(),
          containerRect,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        })
      : null

  return {
    pos: table.pos,
    rowRects: Array.from({ length: map.height }, (_, row) =>
      toContainerRect(getRowDom(editor, table.pos, map, row)),
    ),
    colRects: Array.from({ length: map.width }, (_, col) =>
      toContainerRect(getCellDom(editor, table.pos, map, 0, col)),
    ),
  }
}

const rectsEqual = (a: Rect | null, b: Rect | null): boolean => {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  )
}

const rectListsEqual = (a: (Rect | null)[], b: (Rect | null)[]): boolean =>
  a.length === b.length && a.every((rect, i) => rectsEqual(rect, b[i] ?? null))

const sameGeometry = (a: TableGeometry, b: TableGeometry): boolean =>
  a.pos === b.pos &&
  rectListsEqual(a.rowRects, b.rowRects) &&
  rectListsEqual(a.colRects, b.colRects)

/**
 * Chooses what to publish after a fresh measurement.
 *
 * Measurement runs on every transaction, scroll and resize, and almost always
 * produces the same numbers. Handing back the previous array when nothing moved
 * keeps handles mounted and stops consumers keyed on the geometry identity from
 * re-subscribing; handing back the previous *entry* for each table that did not
 * move confines the re-render to the table that did.
 */
export const reconcileGeometries = (
  previous: TableGeometry[],
  next: TableGeometry[],
): TableGeometry[] => {
  // A table was added or removed, so entries no longer line up by index.
  if (previous.length !== next.length) return next

  let changed = false
  const merged = next.map((geometry, index) => {
    const before = previous[index]
    if (before && sameGeometry(before, geometry)) return before
    changed = true
    return geometry
  })

  return changed ? merged : previous
}
