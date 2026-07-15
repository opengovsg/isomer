import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box, Icon } from "@chakra-ui/react"
import { moveTableColumn, moveTableRow, TableMap } from "@tiptap/pm/tables"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { BiGridVertical } from "react-icons/bi"

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
 * Walks the document and returns every `table` node + its doc position, in
 * document order. Drag handles only ever act on one table at a time ("the
 * table currently being interacted with"), but that table must be resolved
 * by pointer hit-testing — not by always taking the first table in the doc
 * (which left subsequent tables without handles).
 */
const findAllTables = (editor: TiptapEditor): TableLocation[] => {
  const tables: TableLocation[] = []
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "table") {
      tables.push({ pos, node })
      // Tables cannot be nested, so skip their contents.
      return false
    }
    return true
  })
  return tables
}

const measureTableGeometry = (
  editor: TiptapEditor,
  table: TableLocation,
  container: HTMLElement,
  containerRect: DOMRect,
): TableGeometry => {
  const map = TableMap.get(table.node)
  const rowRects: (Rect | null)[] = []
  for (let r = 0; r < map.height; r++) {
    const dom = getRowDom(editor, table.pos, map, r)
    rowRects.push(
      dom
        ? domRectToContainerRelative(
            dom.getBoundingClientRect(),
            containerRect,
            container,
          )
        : null,
    )
  }
  const colRects: (Rect | null)[] = []
  for (let c = 0; c < map.width; c++) {
    const dom = getCellDom(editor, table.pos, map, 0, c)
    colRects.push(
      dom
        ? domRectToContainerRelative(
            dom.getBoundingClientRect(),
            containerRect,
            container,
          )
        : null,
    )
  }
  return { pos: table.pos, rowRects, colRects }
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

interface TableGeometry {
  /** ProseMirror document position of this table's opening boundary. */
  pos: number
  rowRects: (Rect | null)[]
  colRects: (Rect | null)[]
}

interface DragState {
  axis: "row" | "column"
  from: number
  /** Table this drag targets — must not be re-resolved from "first table in doc". */
  tablePos: number
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

const HANDLE_MARGIN_PX = 28
/** Equal padding on every side between the grip icon and the chip border. */
const HANDLE_PADDING_PX = 2
const HANDLE_BORDER_PX = 1
/**
 * `BiGridVertical` is a square SVG, but its 2×3 dots read taller than
 * wide. Paint the icon into that visual aspect so padding looks even
 * around the dots (not around empty SVG letterboxing).
 */
const GRIP_SHORT_PX = 8
const GRIP_LONG_PX = 12
/** Outer size = icon + equal padding + border on each side. */
const outerSize = (contentW: number, contentH: number) => ({
  w: contentW + HANDLE_PADDING_PX * 2 + HANDLE_BORDER_PX * 2,
  h: contentH + HANDLE_PADDING_PX * 2 + HANDLE_BORDER_PX * 2,
})
const ROW_HANDLE = outerSize(GRIP_SHORT_PX, GRIP_LONG_PX)
const COL_HANDLE = outerSize(GRIP_LONG_PX, GRIP_SHORT_PX)
/** Stable empty rect list — avoids a fresh `[]` each render breaking useMemo deps. */
const EMPTY_RECTS: (Rect | null)[] = []

const handleStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "grab",
  color: "base.content.medium",
  bg: "base.canvas.default",
  border: `${HANDLE_BORDER_PX}px solid`,
  borderColor: "interaction.main.default",
  borderRadius: "0.25rem",
  userSelect: "none",
  zIndex: "2",
  // `content-box` so the declared w/h are the icon's paint box; equal
  // padding and the border sit outside that, keeping breathing room even.
  boxSizing: "content-box",
  p: `${HANDLE_PADDING_PX}px`,
  lineHeight: 0,
} as const

/**
 * Same 6-dot grip used by block/nav drag handles (`BiGridVertical`).
 * Painted into a non-square box matching the 2×3 (or rotated 3×2) aspect
 * so equal CSS padding around the chip reads as equal padding around the
 * dots.
 */
const GripIcon = ({ rotate }: { rotate?: boolean }) => {
  const icon = (
    <Icon
      as={BiGridVertical}
      w={`${GRIP_SHORT_PX}px`}
      h={`${GRIP_LONG_PX}px`}
      // Stretch the square viewBox into the rectangular paint box so we
      // don't reintroduce letterboxed empty space inside the icon itself.
      preserveAspectRatio="none"
      transform={rotate ? "rotate(90deg)" : undefined}
      aria-hidden
    />
  )

  if (!rotate) return icon

  // `transform: rotate` doesn't change layout size, so wrap in a landscape
  // box matching the post-rotation visual — otherwise the chip's flex
  // centering still lays out the tall pre-rotation footprint.
  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w={`${GRIP_LONG_PX}px`}
      h={`${GRIP_SHORT_PX}px`}
      flexShrink={0}
      lineHeight={0}
    >
      {icon}
    </Box>
  )
}

const RowHandle = ({
  rect,
  onMouseDown,
}: {
  rect: Rect
  onMouseDown: (e: React.MouseEvent) => void
}) => (
  <Box
    position="absolute"
    left={`${rect.left - ROW_HANDLE.w / 2}px`}
    top={`${rect.top + (rect.height - ROW_HANDLE.h) / 2}px`}
    w={`${GRIP_SHORT_PX}px`}
    h={`${GRIP_LONG_PX}px`}
    {...handleStyle}
    onMouseDown={onMouseDown}
    title="Drag to reorder row"
    aria-label="Drag to reorder row"
    role="button"
  >
    <GripIcon />
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
    top={`${rect.top - COL_HANDLE.h / 2}px`}
    left={`${rect.left + (rect.width - COL_HANDLE.w) / 2}px`}
    w={`${GRIP_LONG_PX}px`}
    h={`${GRIP_SHORT_PX}px`}
    {...handleStyle}
    onMouseDown={onMouseDown}
    title="Drag to reorder column"
    aria-label="Drag to reorder column"
    role="button"
  >
    <GripIcon rotate />
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
 * row/column boundary while dragging. The header row is draggable like any
 * other row, and header columns are draggable like any other column.
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
  const [hoverTablePos, setHoverTablePos] = useState<number | null>(null)
  const [hoverRow, setHoverRow] = useState<number | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)

  const [geometries, setGeometries] = useState<TableGeometry[]>([])

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
      setGeometries([])
      return
    }

    const measure = () => {
      const container = containerRef.current
      if (!container) {
        setGeometries([])
        return
      }
      const containerRect = container.getBoundingClientRect()
      setGeometries(
        findAllTables(editor).map((table) =>
          measureTableGeometry(editor, table, container, containerRect),
        ),
      )
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

      let matchedTablePos: number | null = null
      let matchedRow: number | null = null
      let matchedCol: number | null = null

      for (const geometry of geometries) {
        let rowHit: number | null = null
        geometry.rowRects.forEach((rect, i) => {
          if (!rect) return
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
            rowHit = i
          }
        })

        let colHit: number | null = null
        const headerRowRect = geometry.rowRects[0]
        if (headerRowRect) {
          const headerTop = headerRowRect.top + containerRect.top
          // The column handle always renders above the header row, but it
          // should stay visible while hovering ANY row of the table (not
          // just the header row) — so the hit band spans the full table
          // height, not just the header row's own height.
          const tableRects = geometry.rowRects.filter((r): r is Rect => !!r)
          const lastRowRect = tableRects[tableRects.length - 1]
          const tableBottom = lastRowRect
            ? lastRowRect.top + lastRowRect.height + containerRect.top
            : headerTop + headerRowRect.height
          geometry.colRects.forEach((rect, i) => {
            if (!rect) return
            const left = rect.left + containerRect.left
            const right = left + rect.width
            if (
              clientX >= left &&
              clientX <= right &&
              clientY >= headerTop - HANDLE_MARGIN_PX &&
              clientY <= tableBottom
            ) {
              colHit = i
            }
          })
        }

        if (rowHit !== null || colHit !== null) {
          matchedTablePos = geometry.pos
          matchedRow = rowHit
          matchedCol = colHit
          break
        }
      }

      setHoverTablePos(matchedTablePos)
      setHoverRow(matchedRow)
      setHoverCol(matchedCol)
    }

    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [geometries, containerRef])

  const activeTablePos = drag?.tablePos ?? hoverTablePos
  const activeGeometry =
    geometries.find((g) => g.pos === activeTablePos) ?? null
  const rowRects = activeGeometry?.rowRects ?? EMPTY_RECTS
  const colRects = activeGeometry?.colRects ?? EMPTY_RECTS

  const startRowDrag = (rowIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (activeTablePos === null) return
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
      tablePos: activeTablePos,
      pointer: e.clientY - containerTop,
      boundaries,
    }
    dragRef.current = state
    setDrag(state)
  }

  const startColDrag = (colIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (activeTablePos === null) return
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
      tablePos: activeTablePos,
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
      // Use the table captured at drag start — never re-resolve to the
      // first table in the document.
      if (current.axis === "row") {
        moveTableRow({ from: current.from, to, pos: current.tablePos + 1 })(
          editor.state,
          editor.view.dispatch,
        )
        return
      }
      moveTableColumn({ from: current.from, to, pos: current.tablePos + 1 })(
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
        const isHovered = hoverRow === i
        const isDragging = drag?.axis === "row" && drag.from === i
        if (!isHovered && !isDragging) return null
        return (
          <RowHandle
            key={`row-${activeTablePos}-${i}`}
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
            key={`col-${activeTablePos}-${i}`}
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
