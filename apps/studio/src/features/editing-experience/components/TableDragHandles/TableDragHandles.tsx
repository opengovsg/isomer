import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box, Icon } from "@chakra-ui/react"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  selectedRect,
  TableMap,
} from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { BiGridVertical } from "react-icons/bi"
import {
  containerRectToViewportRect,
  type Rect,
  viewportPointToContainerPoint,
  viewportRectToContainerRect,
} from "~/features/editing-experience/utils/tableEditorGeometry"

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
  onDragStateChange?: (isDragging: boolean) => void
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
        ? viewportRectToContainerRect({
            rect: dom.getBoundingClientRect(),
            containerRect,
            scrollTop: container.scrollTop,
            scrollLeft: container.scrollLeft,
          })
        : null,
    )
  }
  const colRects: (Rect | null)[] = []
  for (let c = 0; c < map.width; c++) {
    const dom = getCellDom(editor, table.pos, map, 0, c)
    colRects.push(
      dom
        ? viewportRectToContainerRect({
            rect: dom.getBoundingClientRect(),
            containerRect,
            scrollTop: container.scrollTop,
            scrollLeft: container.scrollLeft,
          })
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

/**
 * Pointer-down on a handle that has not yet crossed the drag threshold. A
 * release without crossing selects the whole row/column; crossing promotes
 * this into a real `DragState` for reorder.
 */
interface PendingGesture {
  axis: "row" | "column"
  from: number
  tablePos: number
  startClientX: number
  startClientY: number
  boundaries: number[]
}

/** Movement past this (in CSS px) turns a handle click into a drag-reorder. */
const DRAG_THRESHOLD_PX = 4

const selectWholeRow = (
  editor: TiptapEditor,
  tablePos: number,
  rowIndex: number,
) => {
  const table = editor.state.doc.nodeAt(tablePos)
  if (!table || table.type.name !== "table") return
  const map = TableMap.get(table)
  const cellPos = tablePos + 1 + map.positionAt(rowIndex, 0, table)
  const selection = CellSelection.rowSelection(
    editor.state.doc.resolve(cellPos),
  )
  editor.view.dispatch(editor.state.tr.setSelection(selection))
  editor.view.focus()
}

const selectWholeColumn = (
  editor: TiptapEditor,
  tablePos: number,
  colIndex: number,
) => {
  const table = editor.state.doc.nodeAt(tablePos)
  if (!table || table.type.name !== "table") return
  const map = TableMap.get(table)
  const cellPos = tablePos + 1 + map.positionAt(0, colIndex, table)
  const selection = CellSelection.colSelection(
    editor.state.doc.resolve(cellPos),
  )
  editor.view.dispatch(editor.state.tr.setSelection(selection))
  editor.view.focus()
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
/** Passive rail — shorter/thinner than the grip chip so it reads as quiet. */
const PASSIVE_ROW_PX = { w: 3, h: 10 }
const PASSIVE_COL_PX = { w: 10, h: 3 }
/** Outer size = icon + equal padding + border on each side. */
const outerSize = (contentW: number, contentH: number) => ({
  w: contentW + HANDLE_PADDING_PX * 2 + HANDLE_BORDER_PX * 2,
  h: contentH + HANDLE_PADDING_PX * 2 + HANDLE_BORDER_PX * 2,
})
const ROW_HANDLE = outerSize(GRIP_SHORT_PX, GRIP_LONG_PX)
const COL_HANDLE = outerSize(GRIP_LONG_PX, GRIP_SHORT_PX)
/** Stable empty lists — avoids a fresh `[]` each render breaking useMemo deps. */
const EMPTY_RECTS: (Rect | null)[] = []
const EMPTY_INDEXES: number[] = []
const EMPTY_GEOMETRIES: TableGeometry[] = []

type HandleVisualState = "passive" | "hover" | "selected" | "dragging"

/**
 * Which row/column handles should stay in the selected visual from the
 * current `CellSelection`. Whole-table selections are ignored — those don't
 * map to a single row/column handle.
 */
const getSelectionHandleTarget = (
  editor: TiptapEditor,
): { tablePos: number; rows: number[]; cols: number[] } | null => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return null

  const isRow = selection.isRowSelection()
  const isCol = selection.isColSelection()
  if ((isRow && isCol) || (!isRow && !isCol)) return null

  const rect = selectedRect(editor.state)
  const tablePos = rect.tableStart - 1
  if (isRow) {
    const rows: number[] = []
    for (let r = rect.top; r < rect.bottom; r++) rows.push(r)
    return { tablePos, rows, cols: EMPTY_INDEXES }
  }
  const cols: number[] = []
  for (let c = rect.left; c < rect.right; c++) cols.push(c)
  return { tablePos, rows: EMPTY_INDEXES, cols }
}

const resolveHandleState = ({
  isSelected,
  isDragging,
  pointerOnHandle,
}: {
  isSelected: boolean
  isDragging: boolean
  pointerOnHandle: boolean
}): HandleVisualState => {
  if (isDragging) return "dragging"
  if (isSelected) return "selected"
  if (pointerOnHandle) return "hover"
  return "passive"
}

const selectedChrome = {
  bg: "interaction.main.default",
  borderColor: "interaction.main.default",
  color: "base.content.inverse",
} as const

const handleChromeByState = (state: HandleVisualState) => {
  switch (state) {
    case "passive":
      return {
        bg: "transparent",
        borderColor: "transparent",
        color: "base.content.medium",
        cursor: "pointer",
      }
    case "hover":
      return {
        bg: "base.canvas.default",
        borderColor: "base.divider.strong",
        color: "base.content.medium",
        cursor: "grab",
      }
    case "selected":
      return {
        ...selectedChrome,
        cursor: "grab",
      }
    case "dragging":
      return {
        ...selectedChrome,
        cursor: "grabbing",
      }
  }
}

const handleBaseStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: `${HANDLE_BORDER_PX}px solid`,
  borderRadius: "0.25rem",
  userSelect: "none",
  zIndex: "2",
  // `content-box` so the declared w/h are the icon's paint box; equal
  // padding and the border sit outside that, keeping breathing room even.
  // Hit box size is identical across states so the target doesn't jump
  // under the cursor when the chrome changes.
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

const PassiveRail = ({ axis }: { axis: "row" | "column" }) => {
  const size = axis === "row" ? PASSIVE_ROW_PX : PASSIVE_COL_PX
  return (
    <Box
      w={`${size.w}px`}
      h={`${size.h}px`}
      bg="base.content.medium"
      borderRadius="1px"
      opacity={0.55}
      aria-hidden
    />
  )
}

const RowHandle = ({
  rect,
  state,
  tablePos,
  index,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: {
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) => (
  <Box
    position="absolute"
    left={`${rect.left - ROW_HANDLE.w / 2}px`}
    top={`${rect.top + (rect.height - ROW_HANDLE.h) / 2}px`}
    w={`${GRIP_SHORT_PX}px`}
    h={`${GRIP_LONG_PX}px`}
    {...handleBaseStyle}
    {...handleChromeByState(state)}
    onMouseDown={onMouseDown}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    title="Select or drag to reorder row"
    aria-label="Drag to reorder row"
    role="button"
    data-state={state}
    data-table-drag-handle="row"
    data-table-pos={tablePos}
    data-index={index}
  >
    {state === "passive" ? <PassiveRail axis="row" /> : <GripIcon />}
  </Box>
)

const ColumnHandle = ({
  rect,
  state,
  tablePos,
  index,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
}: {
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  onMouseDown: (e: React.MouseEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}) => (
  <Box
    position="absolute"
    top={`${rect.top - COL_HANDLE.h / 2}px`}
    left={`${rect.left + (rect.width - COL_HANDLE.w) / 2}px`}
    w={`${GRIP_LONG_PX}px`}
    h={`${GRIP_SHORT_PX}px`}
    {...handleBaseStyle}
    {...handleChromeByState(state)}
    onMouseDown={onMouseDown}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    title="Select or drag to reorder column"
    aria-label="Drag to reorder column"
    role="button"
    data-state={state}
    data-table-drag-handle="column"
    data-table-pos={tablePos}
    data-index={index}
  >
    {state === "passive" ? <PassiveRail axis="column" /> : <GripIcon rotate />}
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
 * Handle chrome has four visual states:
 * - `passive` — pointer over a cell (not the handle): short grey rail
 * - `hover` — pointer over the handle before selecting: grip chip with grey border
 * - `selected` — clicked: blue filled chip + white grip; whole row/column is
 *   a `CellSelection` (bubble menu can show)
 * - `dragging` — pointer past the drag threshold: same chrome as selected
 *   with a closed-hand cursor; bubble menu stays hidden
 *
 * A click (pointer-up without crossing the drag threshold) selects the whole
 * row/column; a real drag still reorders. Drop-indicator line at the nearest
 * boundary while dragging. Header row/columns are draggable like any other.
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
  onDragStateChange,
}: TableDragHandlesProps) => {
  const [hoverTablePos, setHoverTablePos] = useState<number | null>(null)
  const [hoverRow, setHoverRow] = useState<number | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [pointerOnRowHandle, setPointerOnRowHandle] = useState(false)
  const [pointerOnColHandle, setPointerOnColHandle] = useState(false)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<PendingGesture | null>(null)

  const [geometries, setGeometries] = useState<TableGeometry[]>([])

  // Selection-driven selected chrome must survive the pointer leaving the
  // handle (the bubble menu may cover it). Document + selection identity
  // keeps meta-only blur/focus traffic from forcing a re-render.
  const selectionTarget = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current ? getSelectionHandleTarget(current) : null,
    equalityFn: (previous, next) => {
      if (previous === next) return true
      if (!previous || !next) return false
      if (previous.tablePos !== next.tablePos) return false
      if (previous.rows.length !== next.rows.length) return false
      if (previous.cols.length !== next.cols.length) return false
      return (
        previous.rows.every((r, i) => r === next.rows[i]) &&
        previous.cols.every((c, i) => c === next.cols[i])
      )
    },
  })

  // Moving to a different hovered row/col remounts a different handle —
  // clear "pointer on handle" so the new one starts in passive, not hover.
  useEffect(() => {
    setPointerOnRowHandle(false)
  }, [hoverRow, hoverTablePos])
  useEffect(() => {
    setPointerOnColHandle(false)
  }, [hoverCol, hoverTablePos])

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
      // Freeze hover while a handle gesture (pending click or active drag) is
      // in flight — otherwise a tiny pointer wobble can clear the handle
      // mid-click before mouseup selects the row/column.
      if (dragRef.current || pendingRef.current) return
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
          const viewportRect = containerRectToViewportRect({
            rect,
            containerRect,
            scrollTop: container.scrollTop,
            scrollLeft: container.scrollLeft,
          })
          const top = viewportRect.top
          const bottom = top + rect.height
          const left = viewportRect.left
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
          const headerTop = containerRectToViewportRect({
            rect: headerRowRect,
            containerRect,
            scrollTop: container.scrollTop,
            scrollLeft: container.scrollLeft,
          }).top
          // The column handle always renders above the header row, but it
          // should stay visible while hovering ANY row of the table (not
          // just the header row) — so the hit band spans the full table
          // height, not just the header row's own height.
          const tableRects = geometry.rowRects.filter((r): r is Rect => !!r)
          const lastRowRect = tableRects[tableRects.length - 1]
          const tableBottom = lastRowRect
            ? containerRectToViewportRect({
                rect: lastRowRect,
                containerRect,
                scrollTop: container.scrollTop,
                scrollLeft: container.scrollLeft,
              }).top + lastRowRect.height
            : headerTop + headerRowRect.height
          geometry.colRects.forEach((rect, i) => {
            if (!rect) return
            const left = containerRectToViewportRect({
              rect,
              containerRect,
              scrollTop: container.scrollTop,
              scrollLeft: container.scrollLeft,
            }).left
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

  const visibleGeometries = useMemo(() => {
    const positions = new Set<number>()
    if (drag) positions.add(drag.tablePos)
    if (hoverTablePos !== null) positions.add(hoverTablePos)
    if (selectionTarget) positions.add(selectionTarget.tablePos)
    if (positions.size === 0) return EMPTY_GEOMETRIES
    return geometries.filter((g) => positions.has(g.pos))
  }, [drag, hoverTablePos, selectionTarget, geometries])

  // Boundaries / gesture start use the geometry of the table being
  // interacted with (hover or selection), not an ambiguous "first visible".
  const gestureTablePos =
    drag?.tablePos ?? hoverTablePos ?? selectionTarget?.tablePos ?? null
  const gestureGeometry =
    geometries.find((g) => g.pos === gestureTablePos) ?? null
  const gestureRowRects = gestureGeometry?.rowRects ?? EMPTY_RECTS

  const beginRowGesture =
    (tablePos: number, rowIndex: number, rowRects: (Rect | null)[]) =>
    (e: React.MouseEvent) => {
      e.preventDefault()
      const boundaries: number[] = []
      rowRects.forEach((rect, i) => {
        if (!rect) return
        if (i === 0) boundaries.push(rect.top)
        boundaries.push(rect.top + rect.height)
      })
      pendingRef.current = {
        axis: "row",
        from: rowIndex,
        tablePos,
        startClientX: e.clientX,
        startClientY: e.clientY,
        boundaries,
      }
    }

  const beginColGesture =
    (tablePos: number, colIndex: number, colRects: (Rect | null)[]) =>
    (e: React.MouseEvent) => {
      e.preventDefault()
      const boundaries: number[] = []
      colRects.forEach((rect, i) => {
        if (!rect) return
        if (i === 0) boundaries.push(rect.left)
        boundaries.push(rect.left + rect.width)
      })
      pendingRef.current = {
        axis: "column",
        from: colIndex,
        tablePos,
        startClientX: e.clientX,
        startClientY: e.clientY,
        boundaries,
      }
    }

  // The handle's own `cursor: grabbing` only applies while the pointer is
  // over that element. Once the drag leaves the hit box (or the editor
  // container), elements underneath (cells, caption, etc.) reclaim their
  // own cursor. Force grabbing on every node for the drag's duration.
  useEffect(() => {
    if (!drag) return
    const style = document.createElement("style")
    style.setAttribute("data-table-drag-handles-cursor", "")
    style.textContent =
      "*, *::before, *::after { cursor: grabbing !important; }"
    document.head.appendChild(style)
    return () => {
      style.remove()
    }
  }, [drag])

  // Hide the bubble menu while dragging; after drop the mouseup handler
  // reselects the landed row/column and we reveal again (click-without-drag
  // never sets `drag`, so a plain handle click still shows via selection).
  const wasDraggingRef = useRef(false)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (drag) {
      wasDraggingRef.current = true
      onDragStateChange?.(true)
      return
    }
    if (!wasDraggingRef.current) return
    wasDraggingRef.current = false
    queueMicrotask(() => {
      if (!editor.isDestroyed) onDragStateChange?.(false)
    })
  }, [drag, editor, onDragStateChange])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const pending = pendingRef.current
      if (pending && !dragRef.current) {
        const dx = e.clientX - pending.startClientX
        const dy = e.clientY - pending.startClientY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

        const containerRect = container.getBoundingClientRect()
        const pointer = viewportPointToContainerPoint({
          clientX: e.clientX,
          clientY: e.clientY,
          containerRect,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        })
        const state: DragState = {
          axis: pending.axis,
          from: pending.from,
          tablePos: pending.tablePos,
          pointer: pending.axis === "row" ? pointer.y : pointer.x,
          boundaries: pending.boundaries,
        }
        pendingRef.current = null
        dragRef.current = state
        setDrag(state)
        return
      }

      const current = dragRef.current
      if (!current) return
      const containerRect = container.getBoundingClientRect()
      const containerPoint = viewportPointToContainerPoint({
        clientX: e.clientX,
        clientY: e.clientY,
        containerRect,
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      })
      const pointer =
        current.axis === "row" ? containerPoint.y : containerPoint.x
      const next = { ...current, pointer }
      dragRef.current = next
      setDrag(next)
    }

    const onMouseUp = () => {
      const pending = pendingRef.current
      pendingRef.current = null
      const current = dragRef.current
      dragRef.current = null
      setDrag(null)

      // Click (no drag threshold crossed): highlight the whole row/column.
      if (pending && editor) {
        if (pending.axis === "row") {
          selectWholeRow(editor, pending.tablePos, pending.from)
        } else {
          selectWholeColumn(editor, pending.tablePos, pending.from)
        }
        return
      }

      if (!current || !editor) return

      const boundaryIndex = nearestBoundaryIndex(
        current.pointer,
        current.boundaries,
      )
      const to = boundaryToTargetIndex(boundaryIndex, current.from)
      if (to !== current.from) {
        // Bug 3 fix: `pos` must resolve to a position INSIDE the table
        // (prosemirror-tables' `findTable` walks the resolved position's
        // ancestor chain) — `table.pos` alone is the table's own opening
        // boundary, one level too shallow, and the command silently returns
        // `false`. `table.pos + 1` resolves just inside the table.
        // Use the table captured at drag start — never re-resolve to the
        // first table in the document.
        if (current.axis === "row") {
          moveTableRow({
            from: current.from,
            to,
            pos: current.tablePos + 1,
          })(editor.state, editor.view.dispatch)
        } else {
          moveTableColumn({
            from: current.from,
            to,
            pos: current.tablePos + 1,
          })(editor.state, editor.view.dispatch)
        }
      }

      // Reselect the landed row/column so the handle stays selected and the
      // bubble menu can show after drop (same as a click-select).
      if (current.axis === "row") {
        selectWholeRow(editor, current.tablePos, to)
      } else {
        selectWholeColumn(editor, current.tablePos, to)
      }
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
    const first = gestureRowRects.find((r) => r)
    if (!first) return null
    return { left: first.left, width: first.width }
  }, [gestureRowRects])

  const tableSpanY = useMemo(() => {
    const firstRow = gestureRowRects.find((r) => r)
    const lastRow = [...gestureRowRects].reverse().find((r) => r)
    if (!firstRow || !lastRow) return null
    return {
      top: firstRow.top,
      height: lastRow.top + lastRow.height - firstRow.top,
    }
  }, [gestureRowRects])

  if (!editor) return null

  return (
    <>
      {visibleGeometries.map((geometry) => {
        const isHoverTable = hoverTablePos === geometry.pos
        const selectionRows =
          selectionTarget?.tablePos === geometry.pos
            ? selectionTarget.rows
            : EMPTY_INDEXES
        const selectionCols =
          selectionTarget?.tablePos === geometry.pos
            ? selectionTarget.cols
            : EMPTY_INDEXES

        return (
          <Box key={`table-${geometry.pos}`} as="span" display="contents">
            {geometry.rowRects.map((rect, i) => {
              if (!rect) return null
              const isHovered = isHoverTable && hoverRow === i
              const isInSelection = selectionRows.includes(i)
              const isSelected = selectionRows.length === 1 && isInSelection
              const isDragging =
                drag?.axis === "row" &&
                drag.tablePos === geometry.pos &&
                drag.from === i
              if (!isHovered && !isInSelection && !isDragging) return null
              const state = resolveHandleState({
                isSelected,
                isDragging,
                pointerOnHandle: isHovered && pointerOnRowHandle,
              })
              return (
                <RowHandle
                  key={`row-${geometry.pos}-${i}`}
                  rect={rect}
                  state={state}
                  tablePos={geometry.pos}
                  index={i}
                  onMouseDown={beginRowGesture(
                    geometry.pos,
                    i,
                    geometry.rowRects,
                  )}
                  onMouseEnter={() => setPointerOnRowHandle(true)}
                  onMouseLeave={() => setPointerOnRowHandle(false)}
                />
              )
            })}

            {geometry.colRects.map((rect, i) => {
              if (!rect) return null
              const isHovered = isHoverTable && hoverCol === i
              const isInSelection = selectionCols.includes(i)
              const isSelected = selectionCols.length === 1 && isInSelection
              const isDragging =
                drag?.axis === "column" &&
                drag.tablePos === geometry.pos &&
                drag.from === i
              if (!isHovered && !isInSelection && !isDragging) return null
              const state = resolveHandleState({
                isSelected,
                isDragging,
                pointerOnHandle: isHovered && pointerOnColHandle,
              })
              return (
                <ColumnHandle
                  key={`col-${geometry.pos}-${i}`}
                  rect={rect}
                  state={state}
                  tablePos={geometry.pos}
                  index={i}
                  onMouseDown={beginColGesture(
                    geometry.pos,
                    i,
                    geometry.colRects,
                  )}
                  onMouseEnter={() => setPointerOnColHandle(true)}
                  onMouseLeave={() => setPointerOnColHandle(false)}
                />
              )
            })}
          </Box>
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
