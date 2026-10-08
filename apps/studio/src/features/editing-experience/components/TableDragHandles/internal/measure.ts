/**
 * Reads table geometry out of a live editor: finds every table, measures its
 * rows and columns, and converts between viewport and container coordinates.
 *
 * This is the only part of the module that needs a real DOM. The rules built
 * from its output live in `axisMath.ts`.
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
  /**
   * Uniform scale from CSS transforms on the container and its ancestors.
   * `getBoundingClientRect` includes that scale; absolutely positioned handles
   * do not. Defaults to 1.
   */
  scale?: { x: number; y: number }
}

// A zero scale would send every position to infinity. Treat it as unscaled.
const scaleOf = (
  scale: ContainerOffset["scale"],
): { x: number; y: number } => ({
  x: scale?.x || 1,
  y: scale?.y || 1,
})

/**
 * The focused table editor opens in a modal that scales in from 95%. Handles
 * are positioned in layout pixels, so a measurement taken mid-animation has to
 * cancel that ancestor transform. Otherwise the add pills stay inset, overlapping
 * the table, until the next editor transaction.
 */
export const readAncestorLayoutScale = (
  element: HTMLElement,
): { x: number; y: number } => {
  let x = 1
  let y = 1
  let current: HTMLElement | null = element
  while (current) {
    const { transform } = getComputedStyle(current)
    if (transform && transform !== "none") {
      const matrix = new DOMMatrix(transform)
      x *= matrix.a
      y *= matrix.d
    }
    current = current.parentElement
  }
  return { x: x || 1, y: y || 1 }
}

const viewportRectToContainerRect = ({
  rect,
  containerRect,
  scrollTop,
  scrollLeft,
  scale,
}: ContainerOffset & { rect: Rect }): Rect => {
  const { x, y } = scaleOf(scale)
  return {
    top: (rect.top - containerRect.top) / y + scrollTop,
    left: (rect.left - containerRect.left) / x + scrollLeft,
    width: rect.width / x,
    height: rect.height / y,
  }
}

export const viewportPointToContainerPoint = ({
  clientX,
  clientY,
  containerRect,
  scrollTop,
  scrollLeft,
  scale,
}: ContainerOffset & {
  clientX: number
  clientY: number
}): { x: number; y: number } => {
  const { x: scaleX, y: scaleY } = scaleOf(scale)
  return {
    x: (clientX - containerRect.left) / scaleX + scrollLeft,
    y: (clientY - containerRect.top) / scaleY + scrollTop,
  }
}

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

// The React node view wraps the `<table>`, so `nodeDOM` on the table position
// is that wrapper. A plain table element is returned as-is.
const getTableElement = (
  editor: TiptapEditor,
  tablePos: number,
): HTMLTableElement | null => {
  const dom = editor.view.nodeDOM(tablePos)
  if (dom instanceof HTMLTableElement) return dom
  if (!(dom instanceof HTMLElement)) return null
  const table = dom.querySelector("table")
  return table instanceof HTMLTableElement ? table : null
}

// `rows` is every `<tr>` in order. A rowspan cell lives in the row where the
// span starts, so measuring column 0's cell would repeat that upper row and
// lift the add-row pill.
const getRowDom = (
  table: HTMLTableElement | null,
  row: number,
): HTMLElement | null => table?.rows[row] ?? null

export const measureTableGeometry = (
  editor: TiptapEditor,
  table: TableLocation,
  container: HTMLElement,
  containerRect: DOMRect,
  scale: { x: number; y: number },
): TableGeometry => {
  const map = TableMap.get(table.node)
  const tableElement = getTableElement(editor, table.pos)
  const toContainerRect = (dom: HTMLElement | null): Rect | null =>
    dom
      ? viewportRectToContainerRect({
          rect: dom.getBoundingClientRect(),
          containerRect,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
          scale,
        })
      : null

  return {
    pos: table.pos,
    rowRects: Array.from({ length: map.height }, (_, row) =>
      toContainerRect(getRowDom(tableElement, row)),
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

const sameGeometry = (
  a: TableGeometry | undefined,
  b: TableGeometry,
): boolean =>
  !!a &&
  a.pos === b.pos &&
  rectListsEqual(a.rowRects, b.rowRects) &&
  rectListsEqual(a.colRects, b.colRects)

/**
 * Chooses what to publish after a fresh measurement.
 *
 * Measurement runs on every transaction, scroll and resize, and almost always
 * produces the same numbers. Handing back the previous array when nothing moved
 * keeps handles mounted and stops the effects keyed on the geometry identity
 * from re-subscribing.
 */
export const reconcileGeometries = (
  previous: TableGeometry[],
  next: TableGeometry[],
): TableGeometry[] => {
  // A table was added or removed, so entries no longer line up by index.
  if (previous.length !== next.length) return next
  return next.every((geometry, i) => sameGeometry(previous[i], geometry))
    ? previous
    : next
}
