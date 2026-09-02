import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import { TableMap } from "@tiptap/pm/tables"
import {
  type Rect,
  viewportRectToContainerRect,
} from "~/features/editing-experience/utils/tableEditorGeometry"

import type { Axis } from "./axis"
import { AXIS } from "./axis"

export interface TableGeometry {
  pos: number
  rowRects: (Rect | null)[]
  colRects: (Rect | null)[]
}

export interface TableLocation {
  pos: number
  node: ProseMirrorNode
}

export const EMPTY_RECTS: (Rect | null)[] = []

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

export const rectsForAxis = (
  geometry: TableGeometry,
  axis: Axis,
): (Rect | null)[] => (axis === "row" ? geometry.rowRects : geometry.colRects)

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

// Measurement runs on every transaction, so bail out when nothing moved —
// a fresh array would otherwise re-render every handle and churn the
// window listeners keyed on the geometry identity.
export const geometriesEqual = (
  a: TableGeometry[],
  b: TableGeometry[],
): boolean =>
  a.length === b.length &&
  a.every((geometry, i) => {
    const other = b[i]
    return (
      !!other &&
      geometry.pos === other.pos &&
      rectListsEqual(geometry.rowRects, other.rowRects) &&
      rectListsEqual(geometry.colRects, other.colRects)
    )
  })

/** Outer bounds of the whole table, in container coordinates. */
export const getTableBounds = (geometry: TableGeometry) => {
  const rowRects = geometry.rowRects.filter((r): r is Rect => !!r)
  const colRects = geometry.colRects.filter((r): r is Rect => !!r)
  const firstRow = rowRects[0]
  const lastRow = rowRects[rowRects.length - 1]
  const firstCol = colRects[0]
  const lastCol = colRects[colRects.length - 1]
  if (!firstRow || !lastRow || !firstCol || !lastCol) return null
  return {
    left: firstCol.left,
    top: firstRow.top,
    width: lastCol.left + lastCol.width - firstCol.left,
    height: lastRow.top + lastRow.height - firstRow.top,
  }
}

/** Span of the table derived from its rows, used to size the drop indicator. */
export const getRowSpan = (rowRects: (Rect | null)[]) => {
  const rects = rowRects.filter((r): r is Rect => !!r)
  const first = rects[0]
  const last = rects[rects.length - 1]
  if (!first || !last) return null
  return {
    left: first.left,
    width: first.width,
    top: first.top,
    height: last.top + last.height - first.top,
  }
}

/**
 * Positions where a dragged slot may land: the leading edge of the first
 * movable slot, then the trailing edge of every slot after it.
 */
export const collectAxisBoundaries = (
  rects: (Rect | null)[],
  lockMinIndex: number,
  axis: Axis,
): number[] => {
  const { startOf, sizeOf } = AXIS[axis]
  const boundaries: number[] = []
  rects.forEach((rect, i) => {
    if (!rect) return
    if (i === lockMinIndex) boundaries.push(startOf(rect))
    if (i >= lockMinIndex) boundaries.push(startOf(rect) + sizeOf(rect))
  })
  return boundaries
}

export const boundariesFromGeometry = (
  geometry: TableGeometry,
  axis: Axis,
  lockMinIndex: number,
): number[] =>
  collectAxisBoundaries(rectsForAxis(geometry, axis), lockMinIndex, axis)

export const nearestBoundaryIndex = (
  pointer: number,
  boundaries: number[],
): number => {
  let closest = 0
  let closestDist = Infinity
  boundaries.forEach((boundary, i) => {
    const dist = Math.abs(boundary - pointer)
    if (dist < closestDist) {
      closestDist = dist
      closest = i
    }
  })
  return closest
}

export const resolveDropIndex = ({
  pointer,
  boundaries,
  from,
  lockMinIndex,
}: {
  pointer: number
  boundaries: number[]
  from: number
  lockMinIndex: number
}): number => {
  const boundaryIndex = nearestBoundaryIndex(pointer, boundaries) + lockMinIndex
  return Math.max(
    lockMinIndex,
    boundaryIndex > from ? boundaryIndex - 1 : boundaryIndex,
  )
}
