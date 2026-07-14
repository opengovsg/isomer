import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box } from "@chakra-ui/react"
import { moveTableColumn, moveTableRow, TableMap } from "@tiptap/pm/tables"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

export interface TableDragHandlesProps {
  editor: TiptapEditor | null
  /**
   * The scrollable/positioned element that wraps the rendered editor
   * content (must be `position: relative` or similar), used as the
   * coordinate origin for handle/drop-indicator positions. Pass the same
   * ref given to `TableCaption` — the element that directly wraps
   * `EditorContent`.
   */
  containerRef: RefObject<HTMLElement>
}

interface TableLocation {
  /** ProseMirror document position of the `table` node's own opening boundary. */
  pos: number
  node: ProseMirrorNode
}

/**
 * Finds the single `table` node in the doc and returns its node + doc
 * position. Ported from the verified prototype
 * (`prototype/rte-table-drag-handle`); unlike `TableCaption` (which must
 * support multiple tables in one document), drag handles only ever act on
 * "the table currently being interacted with", resolved fresh per
 * measurement pass.
 */
const findTable = (editor: TiptapEditor): TableLocation | null => {
  let result: TableLocation | null = null
  editor.state.doc.descendants((node, pos) => {
    if (result) return false
    if (node.type.name === "table") {
      result = { pos, node }
      return false
    }
    return true
  })
  return result
}

const getRowDom = (
  editor: TiptapEditor,
  tablePos: number,
  map: TableMap,
  row: number,
): HTMLElement | null => {
  const cellStart = map.map[row * map.width]
  if (cellStart === undefined) return null
  const cellPos = tablePos + 1 + cellStart
  const cellDom = editor.view.nodeDOM(cellPos)
  if (!(cellDom instanceof HTMLElement)) return null
  return cellDom.closest("tr")
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
  const cellPos = tablePos + 1 + cellStart
  const dom = editor.view.nodeDOM(cellPos)
  return dom instanceof HTMLElement ? dom : null
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const domRectToContainerRelative = (
  domRect: DOMRect,
  containerRect: DOMRect,
  container: HTMLElement,
): Rect => ({
  top: domRect.top - containerRect.top + container.scrollTop,
  left: domRect.left - containerRect.left + container.scrollLeft,
  width: domRect.width,
  height: domRect.height,
})

interface DragState {
  axis: "row" | "column"
  from: number
  /** Current pointer position, in the same container-relative coordinate space as `boundaries`. */
  pointer: number
  /**
   * Boundaries between rows/columns, container-relative; boundary index `i`
   * is the position BEFORE item `i`. Has length (count + 1).
   */
  boundaries: number[]
}

const nearestBoundaryIndex = (pointer: number, boundaries: number[]) => {
  let closest = 0
  let closestDist = Infinity
  boundaries.forEach((b, i) => {
    const dist = Math.abs(b - pointer)
    if (dist < closestDist) {
      closestDist = dist
      closest = i
    }
  })
  return closest
}

// Convert a "drop before boundary index `to`" into the target index
// moveTableRow/moveTableColumn expect (an item index in the ORIGINAL,
// pre-removal index space — they handle the shift internally).
const boundaryToTargetIndex = (boundaryIndex: number, from: number) => {
  if (boundaryIndex > from) return boundaryIndex - 1
  return boundaryIndex
}

const GRIP = "⣏⣏" // stacked braille-pattern grip glyph

const HANDLE_MARGIN_PX = 28
/** Outer size of the compact grip chip (square). */
const HANDLE_SIZE_PX = 20
/** Distance from the table border to the handle's outer edge; half the
 *  handle size so the chip is centered on the border. */
const HANDLE_OFFSET_PX = HANDLE_SIZE_PX / 2

const handleStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "grab",
  color: "base.content.medium",
  bg: "base.canvas.default",
  border: "1px solid",
  borderColor: "interaction.main.default",
  borderRadius: "0.25rem",
  fontSize: "0.7rem",
  lineHeight: 1,
  userSelect: "none",
  zIndex: "2",
  w: `${HANDLE_SIZE_PX}px`,
  h: `${HANDLE_SIZE_PX}px`,
} as const

const RowHandle = ({
  rect,
  onMouseDown,
}: {
  rect: Rect
  onMouseDown: (e: React.MouseEvent) => void
}) => (
  <Box
    position="absolute"
    left={`${rect.left - HANDLE_OFFSET_PX}px`}
    top={`${rect.top + (rect.height - HANDLE_SIZE_PX) / 2}px`}
    {...handleStyle}
    onMouseDown={onMouseDown}
    title="Drag to reorder row"
    aria-label="Drag to reorder row"
    role="button"
  >
    {GRIP}
  </Box>
)

const ColumnHandle = ({
  rect,
  onMouseDown,
}: {
  rect: Rect
  onMouseDown: (e: React.MouseEvent) => void
}) => (
  <Box
    position="absolute"
    top={`${rect.top - HANDLE_OFFSET_PX}px`}
    left={`${rect.left + (rect.width - HANDLE_SIZE_PX) / 2}px`}
    {...handleStyle}
    onMouseDown={onMouseDown}
    title="Drag to reorder column"
    aria-label="Drag to reorder column"
    role="button"
  >
    {GRIP}
  </Box>
)

/**
 * Renders hover-only drag handles for reordering table rows/columns, and a
 * drop-indicator line while dragging. Ported from the verified prototype at
 * `prototype/rte-table-drag-handle` (see
 * `.scratch/rte-table-ux/issues/09-prototype-drag-handle-interaction.md`),
 * adapted to this repo's container-relative positioning convention (matching
 * `TableCaption`) instead of the prototype's `position: fixed` viewport
 * coordinates.
 *
 * Locked design (see the ticket's `## Answer`): grip handles appear only on
 * hover (not always-visible); a drop-indicator line renders at the nearest
 * row/column boundary while dragging; the header row itself is NOT
 * draggable (no handle for row index 0), but header columns remain
 * draggable like any other column.
 *
 * Three bugs found and fixed while verifying the prototype (still apply
 * here):
 * 1. `getBoundingClientRect()` must be measured in `useLayoutEffect`, not
 *    during render — a render-time measurement can capture an all-zero
 *    rect before layout is flushed, and would never get recomputed.
 * 2. Hover detection must use `clientX`/`clientY` coordinate math against
 *    measured rects (widened by a margin), not `e.target.closest("tr"/"td")`
 *    — the handle renders outside its row/column's own DOM box, so a
 *    DOM-containment check hides the handle before the cursor can reach it.
 * 3. `moveTableRow`/`moveTableColumn`'s `pos` must resolve to a position
 *    INSIDE the table (`table.pos + 1`), not the table's own opening
 *    boundary (`table.pos`) — the command silently returns `false` otherwise.
 *
 * Must be rendered as a child of `containerRef`'s element (or otherwise
 * absolutely positioned relative to it), since handles/indicators are
 * positioned absolutely against that container's bounding box.
 */
export const TableDragHandles = ({
  editor,
  containerRef,
}: TableDragHandlesProps) => {
  const [hoverRow, setHoverRow] = useState<number | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const [rowRects, setRowRects] = useState<(Rect | null)[]>([])
  const [colRects, setColRects] = useState<(Rect | null)[]>([])

  // Bug 1 fix: measure in useLayoutEffect (after DOM update, before paint),
  // not during render, and re-measure on every editor transaction so
  // handles stay correctly positioned as rows/columns are added, removed,
  // or reordered.
  //
  // One further wrinkle beyond what the prototype hit: `@tiptap/react`'s
  // `EditorContent` mounts the ProseMirror view imperatively in its OWN
  // effect, which can commit its DOM (including flowing the table's real
  // layout) after this component's `useLayoutEffect` has already run once —
  // so even a layout-effect-time measurement can still observe an all-zero
  // rect on first mount. A single `requestAnimationFrame` re-measurement
  // pass after the initial layout effect (in addition to `useLayoutEffect`
  // and re-measuring on every transaction) closes that gap without
  // resorting to polling.
  useLayoutEffect(() => {
    if (!editor) {
      setRowRects([])
      setColRects([])
      return
    }

    const measure = () => {
      const container = containerRef.current
      const table = findTable(editor)
      if (!container || !table) {
        setRowRects([])
        setColRects([])
        return
      }
      const map = TableMap.get(table.node)
      const containerRect = container.getBoundingClientRect()

      const rows: (Rect | null)[] = []
      for (let r = 0; r < map.height; r++) {
        const dom = getRowDom(editor, table.pos, map, r)
        rows.push(
          dom
            ? domRectToContainerRelative(
                dom.getBoundingClientRect(),
                containerRect,
                container,
              )
            : null,
        )
      }
      setRowRects(rows)

      const cols: (Rect | null)[] = []
      for (let c = 0; c < map.width; c++) {
        const dom = getCellDom(editor, table.pos, map, 0, c)
        cols.push(
          dom
            ? domRectToContainerRelative(
                dom.getBoundingClientRect(),
                containerRect,
                container,
              )
            : null,
        )
      }
      setColRects(cols)
    }

    measure()
    const raf = requestAnimationFrame(measure)
    editor.on("transaction", measure)
    editor.on("update", measure)
    return () => {
      cancelAnimationFrame(raf)
      editor.off("transaction", measure)
      editor.off("update", measure)
    }
  }, [editor, containerRef])

  // Bug 2 fix: hover is computed from clientX/clientY coordinate math
  // against the measured rects (widened by HANDLE_MARGIN_PX to cover the
  // handle's own position), not DOM containment — a closest("tr"/"td")
  // check fails the moment the cursor crosses into the handle's own
  // dead-zone margin, hiding the handle before the cursor can reach it.
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) return
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const { clientX, clientY } = e

      let matchedRow: number | null = null
      rowRects.forEach((rect, i) => {
        if (!rect) return
        if (i === 0) return // header row is not draggable — no hover handle either
        const top = rect.top + containerRect.top
        const bottom = top + rect.height
        const left = rect.left + containerRect.left
        const right = left + rect.width
        if (
          clientY >= top &&
          clientY <= bottom &&
          clientX >= left - HANDLE_MARGIN_PX &&
          clientX <= right
        ) {
          matchedRow = i
        }
      })
      setHoverRow(matchedRow)

      let matchedCol: number | null = null
      const headerRowRect = rowRects[0]
      if (headerRowRect) {
        const headerTop = headerRowRect.top + containerRect.top
        const headerBottom = headerTop + headerRowRect.height
        colRects.forEach((rect, i) => {
          if (!rect) return
          const left = rect.left + containerRect.left
          const right = left + rect.width
          if (
            clientX >= left &&
            clientX <= right &&
            clientY >= headerTop - HANDLE_MARGIN_PX &&
            clientY <= headerBottom
          ) {
            matchedCol = i
          }
        })
      }
      setHoverCol(matchedCol)
    }

    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [rowRects, colRects, containerRef])

  const startRowDrag = (rowIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    const boundaries: number[] = []
    rowRects.forEach((rect, i) => {
      if (!rect) return
      if (i === 0) boundaries.push(rect.top)
      boundaries.push(rect.top + rect.height)
    })
    const container = containerRef.current
    const containerTop = container?.getBoundingClientRect().top ?? 0
    const state: DragState = {
      axis: "row",
      from: rowIndex,
      pointer: e.clientY - containerTop,
      boundaries,
    }
    dragRef.current = state
    setDrag(state)
  }

  const startColDrag = (colIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    const boundaries: number[] = []
    colRects.forEach((rect, i) => {
      if (!rect) return
      if (i === 0) boundaries.push(rect.left)
      boundaries.push(rect.left + rect.width)
    })
    const container = containerRef.current
    const containerLeft = container?.getBoundingClientRect().left ?? 0
    const state: DragState = {
      axis: "column",
      from: colIndex,
      pointer: e.clientX - containerLeft,
      boundaries,
    }
    dragRef.current = state
    setDrag(state)
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const current = dragRef.current
      const container = containerRef.current
      if (!current || !container) return
      const containerRect = container.getBoundingClientRect()
      const pointer =
        current.axis === "row"
          ? e.clientY - containerRect.top
          : e.clientX - containerRect.left
      const next = { ...current, pointer }
      dragRef.current = next
      setDrag(next)
    }

    const onMouseUp = () => {
      const current = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (!current || !editor) return
      const table = findTable(editor)
      if (!table) return

      const boundaryIndex = nearestBoundaryIndex(
        current.pointer,
        current.boundaries,
      )
      const to = boundaryToTargetIndex(boundaryIndex, current.from)
      if (to === current.from) return

      // Bug 3 fix: `pos` must resolve to a position INSIDE the table
      // (prosemirror-tables' `findTable` walks the resolved position's
      // ancestor chain) — `table.pos` alone is the table's own opening
      // boundary, one level too shallow, and the command silently returns
      // `false`. `table.pos + 1` resolves just inside the table.
      if (current.axis === "row") {
        moveTableRow({ from: current.from, to, pos: table.pos + 1 })(
          editor.state,
          editor.view.dispatch,
        )
        return
      }
      moveTableColumn({ from: current.from, to, pos: table.pos + 1 })(
        editor.state,
        editor.view.dispatch,
      )
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [editor, containerRef])

  const dropIndicatorPos = useMemo(() => {
    if (!drag) return null
    const boundaryIndex = nearestBoundaryIndex(drag.pointer, drag.boundaries)
    return drag.boundaries[boundaryIndex] ?? null
  }, [drag])

  const tableSpanX = useMemo(() => {
    const first = rowRects.find((r) => r)
    if (!first) return null
    return { left: first.left, width: first.width }
  }, [rowRects])

  const tableSpanY = useMemo(() => {
    const firstRow = rowRects.find((r) => r)
    const lastRow = [...rowRects].reverse().find((r) => r)
    if (!firstRow || !lastRow) return null
    return {
      top: firstRow.top,
      height: lastRow.top + lastRow.height - firstRow.top,
    }
  }, [rowRects])

  if (!editor) return null

  return (
    <>
      {rowRects.map((rect, i) => {
        if (!rect) return null
        if (i === 0) return null // header row not draggable
        const isHovered = hoverRow === i
        const isDragging = drag?.axis === "row" && drag.from === i
        if (!isHovered && !isDragging) return null
        return (
          <RowHandle
            key={`row-${i}`}
            rect={rect}
            onMouseDown={startRowDrag(i)}
          />
        )
      })}

      {colRects.map((rect, i) => {
        if (!rect) return null
        const isHovered = hoverCol === i
        const isDragging = drag?.axis === "column" && drag.from === i
        if (!isHovered && !isDragging) return null
        return (
          <ColumnHandle
            key={`col-${i}`}
            rect={rect}
            onMouseDown={startColDrag(i)}
          />
        )
      })}

      {drag &&
        dropIndicatorPos !== null &&
        drag.axis === "row" &&
        tableSpanX && (
          <Box
            position="absolute"
            left={`${tableSpanX.left}px`}
            top={`${dropIndicatorPos}px`}
            w={`${tableSpanX.width}px`}
            h="2px"
            bg="interaction.main.default"
            zIndex="3"
            pointerEvents="none"
          />
        )}
      {drag &&
        dropIndicatorPos !== null &&
        drag.axis === "column" &&
        tableSpanY && (
          <Box
            position="absolute"
            top={`${tableSpanY.top}px`}
            left={`${dropIndicatorPos}px`}
            w="2px"
            h={`${tableSpanY.height}px`}
            bg="interaction.main.default"
            zIndex="3"
            pointerEvents="none"
          />
        )}
    </>
  )
}
