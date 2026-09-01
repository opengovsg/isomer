import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject, MouseEvent as ReactMouseEvent } from "react"
import { Box } from "@chakra-ui/react"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  selectedRect,
  TableMap,
} from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  ADD_PILL_GAP_PX,
  ADD_PILL_HOVER_BG,
  ADD_PILL_ICON_FILL,
  ADD_PILL_ICON_SIZE_PX,
  ADD_PILL_IDLE_BG,
  ADD_PILL_MIN_LENGTH_PX,
  ADD_PILL_RADIUS_PX,
  ADD_PILL_THICKNESS_PX,
  COL_HANDLE,
  HANDLE_ACTIVE_BG,
  HANDLE_ACTIVE_DOT,
  HANDLE_BORDER_RADIUS_PX,
  HANDLE_GAP_PX,
  HANDLE_HOVER_BG,
  HANDLE_HOVER_DOT,
  HANDLE_IDLE_BG,
  HANDLE_IDLE_DOT,
  isPointerInTableChrome,
  ROW_HANDLE,
} from "~/features/editing-experience/utils/tableEditorChrome"
import {
  containerRectToViewportRect,
  type Rect,
  viewportPointToContainerPoint,
  viewportRectToContainerRect,
} from "~/features/editing-experience/utils/tableEditorGeometry"

import {
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
} from "../TableBubbleMenu/TableBubbleMenu.utils"

export interface TableDragHandlesProps {
  editor: TiptapEditor | null
  containerRef: RefObject<HTMLElement>
  onDragStateChange?: (isDragging: boolean) => void
}

interface TableLocation {
  pos: number
  node: ProseMirrorNode
}

const findAllTables = (editor: TiptapEditor): TableLocation[] => {
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
  pos: number
  rowRects: (Rect | null)[]
  colRects: (Rect | null)[]
}

interface DragState {
  axis: "row" | "column"
  from: number
  tablePos: number
  pointer: number
  boundaries: number[]
  lockMinIndex: number
}

interface PendingGesture {
  axis: "row" | "column"
  from: number
  tablePos: number
  startClientX: number
  startClientY: number
  boundaries: number[]
  lockMinIndex: number
}

const getAxisLockMinIndex = (
  table: ProseMirrorNode,
  axis: "row" | "column",
): number => {
  const map = TableMap.get(table)
  const rect = { top: 0, left: 0, map, table }
  if (axis === "row") {
    return selectionIncludesHeaderRow(rect) ? 1 : 0
  }
  return selectionIncludesHeaderColumn(rect) ? 1 : 0
}

const collectAxisBoundaries = (
  rects: (Rect | null)[],
  lockMinIndex: number,
  edge: "top" | "left",
): number[] => {
  const boundaries: number[] = []
  rects.forEach((rect, i) => {
    if (!rect) return
    const start = edge === "top" ? rect.top : rect.left
    const size = edge === "top" ? rect.height : rect.width
    if (i === lockMinIndex) boundaries.push(start)
    if (i >= lockMinIndex) boundaries.push(start + size)
  })
  return boundaries
}

const boundariesFromGeometry = (
  geometry: TableGeometry,
  axis: "row" | "column",
  lockMinIndex: number,
): number[] =>
  collectAxisBoundaries(
    axis === "row" ? geometry.rowRects : geometry.colRects,
    lockMinIndex,
    axis === "row" ? "top" : "left",
  )

const DRAG_THRESHOLD_PX = 4
const EMPTY_RECTS: (Rect | null)[] = []
const EMPTY_INDEXES: number[] = []
const TABLE_DRAGGING_ATTR = "data-table-drag-handles-dragging"

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

const boundaryToTargetIndex = (boundaryIndex: number, from: number) => {
  if (boundaryIndex > from) return boundaryIndex - 1
  return boundaryIndex
}

const resolveDropIndex = ({
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
  const boundaryIndex = nearestBoundaryIndex(pointer, boundaries)
  return Math.max(
    lockMinIndex,
    boundaryToTargetIndex(boundaryIndex + lockMinIndex, from),
  )
}

type HandleVisualState = "passive" | "selected" | "dragging"

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
}: {
  isSelected: boolean
  isDragging: boolean
}): HandleVisualState => {
  if (isDragging) return "dragging"
  if (isSelected) return "selected"
  return "passive"
}

const handleFill = (isActive: boolean, isHovered: boolean) => {
  if (isActive) {
    return { backgroundColor: HANDLE_ACTIVE_BG, color: HANDLE_ACTIVE_DOT }
  }
  if (isHovered) {
    return { backgroundColor: HANDLE_HOVER_BG, color: HANDLE_HOVER_DOT }
  }
  return { backgroundColor: HANDLE_IDLE_BG, color: HANDLE_IDLE_DOT }
}

const handleChromeByState = (
  state: HandleVisualState,
  isLocked: boolean,
  isHovered: boolean,
) => {
  const isActive = state === "selected" || state === "dragging"
  const cursor = isLocked
    ? "pointer"
    : state === "dragging"
      ? "grabbing"
      : "grab"
  const fill = handleFill(isActive, isHovered)
  return {
    cursor,
    sx: {
      appearance: "none",
      WebkitAppearance: "none",
      ...fill,
      _hover: handleFill(isActive, true),
    },
  }
}

const handleBaseStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 0,
  m: 0,
  border: "0",
  borderRadius: `${HANDLE_BORDER_RADIUS_PX}px`,
  userSelect: "none",
  zIndex: "2",
  boxSizing: "border-box",
  lineHeight: 0,
  flexShrink: 0,
  transition: "background-color 0.15s, color 0.15s",
} as const

const VerticalDotsIcon = () => (
  <Box
    as="svg"
    xmlns="http://www.w3.org/2000/svg"
    width="4px"
    height="14px"
    viewBox="0 0 4 14"
    fill="none"
    flexShrink={0}
    aria-hidden
  >
    <path
      d="M1.66667 5C0.75 5 0 5.75 0 6.66667C0 7.58333 0.75 8.33333 1.66667 8.33333C2.58333 8.33333 3.33333 7.58333 3.33333 6.66667C3.33333 5.75 2.58333 5 1.66667 5ZM1.66667 0C0.75 0 0 0.75 0 1.66667C0 2.58333 0.75 3.33333 1.66667 3.33333C2.58333 3.33333 3.33333 2.58333 3.33333 1.66667C3.33333 0.75 2.58333 0 1.66667 0ZM1.66667 10C0.75 10 0 10.75 0 11.6667C0 12.5833 0.75 13.3333 1.66667 13.3333C2.58333 13.3333 3.33333 12.5833 3.33333 11.6667C3.33333 10.75 2.58333 10 1.66667 10Z"
      fill="currentColor"
    />
  </Box>
)

const HorizontalDotsIcon = () => (
  <Box
    as="svg"
    xmlns="http://www.w3.org/2000/svg"
    width="14px"
    height="4px"
    viewBox="0 0 14 4"
    fill="none"
    flexShrink={0}
    aria-hidden
  >
    <path
      d="M8.3335 1.66667C8.3335 0.75 7.5835 0 6.66683 0C5.75016 0 5.00016 0.75 5.00016 1.66667C5.00016 2.58333 5.75016 3.33333 6.66683 3.33333C7.5835 3.33333 8.3335 2.58333 8.3335 1.66667ZM13.3335 1.66667C13.3335 0.75 12.5835 0 11.6668 0C10.7502 0 10.0002 0.75 10.0002 1.66667C10.0002 2.58333 10.7502 3.33333 11.6668 3.33333C12.5835 3.33333 13.3335 2.58333 13.3335 1.66667ZM3.3335 1.66667C3.3335 0.75 2.5835 0 1.66683 0C0.750163 0 0.000163 0.75 0.000163 1.66667C0.000163 2.58333 0.750163 3.33333 1.66683 3.33333C2.5835 3.33333 3.3335 2.58333 3.3335 1.66667Z"
      fill="currentColor"
    />
  </Box>
)

const AddPlusIcon = () => (
  <Box
    as="svg"
    xmlns="http://www.w3.org/2000/svg"
    width={`${ADD_PILL_ICON_SIZE_PX}px`}
    height={`${ADD_PILL_ICON_SIZE_PX}px`}
    viewBox="0 0 12 12"
    fill="none"
    flexShrink={0}
    aria-hidden
  >
    <path
      d="M9.5 5.5H6.5V2.5H5.5V5.5H2.5V6.5H5.5V9.5H6.5V6.5H9.5V5.5Z"
      fill={ADD_PILL_ICON_FILL}
    />
  </Box>
)

const AddPillButton = ({
  axis,
  left,
  top,
  width,
  height,
  onClick,
}: {
  axis: "row" | "column"
  left: number
  top: number
  width: number
  height: number
  onClick: () => void
}) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Box
      as="button"
      type="button"
      position="absolute"
      left={`${left}px`}
      top={`${top}px`}
      w={`${width}px`}
      h={`${height}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
      border="0"
      borderRadius={`${ADD_PILL_RADIUS_PX}px`}
      cursor="pointer"
      zIndex="2"
      transition="background-color 0.15s"
      aria-label={axis === "row" ? "Add row below" : "Add column to the right"}
      data-table-add-handle={axis}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        appearance: "none",
        WebkitAppearance: "none",
        backgroundColor: isHovered ? ADD_PILL_HOVER_BG : ADD_PILL_IDLE_BG,
        _hover: {
          backgroundColor: ADD_PILL_HOVER_BG,
        },
      }}
      onMouseDown={(event: ReactMouseEvent) => event.preventDefault()}
      onClick={onClick}
    >
      <AddPlusIcon />
    </Box>
  )
}

const RowHandle = ({
  rect,
  state,
  tablePos,
  index,
  isLocked,
  onMouseDown,
  onClick,
}: {
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  isLocked: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onClick: () => void
}) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Box
      as="button"
      type="button"
      position="absolute"
      left={`${rect.left - HANDLE_GAP_PX - ROW_HANDLE.w}px`}
      top={`${rect.top + (rect.height - ROW_HANDLE.h) / 2}px`}
      {...handleBaseStyle}
      {...handleChromeByState(state, isLocked, isHovered)}
      w={`${ROW_HANDLE.w}px`}
      h={`${ROW_HANDLE.h}px`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={isLocked ? "Select row" : "Select or drag to reorder row"}
      aria-label={isLocked ? "Select row" : "Drag to reorder row"}
      data-state={state}
      data-table-drag-handle="row"
      data-table-pos={tablePos}
      data-index={index}
    >
      <VerticalDotsIcon />
    </Box>
  )
}

const ColumnHandle = ({
  rect,
  state,
  tablePos,
  index,
  isLocked,
  onMouseDown,
  onClick,
}: {
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  isLocked: boolean
  onMouseDown: (e: React.MouseEvent) => void
  onClick: () => void
}) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <Box
      as="button"
      type="button"
      position="absolute"
      top={`${rect.top - HANDLE_GAP_PX - COL_HANDLE.h}px`}
      left={`${rect.left + (rect.width - COL_HANDLE.w) / 2}px`}
      {...handleBaseStyle}
      {...handleChromeByState(state, isLocked, isHovered)}
      w={`${COL_HANDLE.w}px`}
      h={`${COL_HANDLE.h}px`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={isLocked ? "Select column" : "Select or drag to reorder column"}
      aria-label={isLocked ? "Select column" : "Drag to reorder column"}
      data-state={state}
      data-table-drag-handle="column"
      data-table-pos={tablePos}
      data-index={index}
    >
      <HorizontalDotsIcon />
    </Box>
  )
}

export const TableDragHandles = ({
  editor,
  containerRef,
  onDragStateChange,
}: TableDragHandlesProps) => {
  const [hoverTablePos, setHoverTablePos] = useState<number | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<PendingGesture | null>(null)
  const suppressNextClickRef = useRef(false)

  const [geometries, setGeometries] = useState<TableGeometry[]>([])

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

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null

    const observeLayout = () => {
      if (!resizeObserver) return
      resizeObserver.disconnect()
      const container = containerRef.current
      if (!container) return
      resizeObserver.observe(container)
      container.querySelectorAll("table").forEach((table) => {
        resizeObserver.observe(table)
      })
    }

    const onEditorChange = () => {
      observeLayout()
      measure()
    }

    measure()
    observeLayout()
    const raf = requestAnimationFrame(() => {
      observeLayout()
      measure()
    })
    editor.on("transaction", onEditorChange)
    editor.on("update", onEditorChange)
    window.addEventListener("resize", measure)
    const container = containerRef.current
    container?.addEventListener("scroll", measure, true)

    return () => {
      cancelAnimationFrame(raf)
      editor.off("transaction", onEditorChange)
      editor.off("update", onEditorChange)
      window.removeEventListener("resize", measure)
      container?.removeEventListener("scroll", measure, true)
      resizeObserver?.disconnect()
    }
  }, [editor, containerRef])

  useLayoutEffect(() => {
    const current = dragRef.current
    if (!current) return
    const geometry = geometries.find((g) => g.pos === current.tablePos)
    if (!geometry) return
    const boundaries = boundariesFromGeometry(
      geometry,
      current.axis,
      current.lockMinIndex,
    )
    if (boundaries.length === 0) return
    if (
      boundaries.length === current.boundaries.length &&
      boundaries.every((value, index) => value === current.boundaries[index])
    ) {
      return
    }
    const next = { ...current, boundaries }
    dragRef.current = next
    setDrag(next)
  }, [geometries])

  useEffect(() => {
    let frame: number | null = null

    const hitTestTables = (clientX: number, clientY: number) => {
      if (dragRef.current || pendingRef.current) return
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      let matchedTablePos: number | null = null

      for (const geometry of geometries) {
        const tableRects = geometry.rowRects.filter((r): r is Rect => !!r)
        const firstRowRect = tableRects[0]
        const lastRowRect = tableRects[tableRects.length - 1]
        if (!firstRowRect || !lastRowRect) continue

        const firstViewport = containerRectToViewportRect({
          rect: firstRowRect,
          containerRect,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        })
        const lastViewport = containerRectToViewportRect({
          rect: lastRowRect,
          containerRect,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        })
        const tableTop = firstViewport.top
        const tableBottom = lastViewport.top + lastRowRect.height
        const tableLeft = firstViewport.left
        const tableRight = firstViewport.left + firstRowRect.width
        if (
          isPointerInTableChrome({
            clientX,
            clientY,
            tableLeft,
            tableTop,
            tableRight,
            tableBottom,
          })
        ) {
          matchedTablePos = geometry.pos
          break
        }
      }

      setHoverTablePos(matchedTablePos)
    }

    const onMove = (event: MouseEvent) => {
      if (frame !== null) return
      const { clientX, clientY } = event
      frame = requestAnimationFrame(() => {
        frame = null
        hitTestTables(clientX, clientY)
      })
    }

    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [geometries, containerRef])

  const gestureTablePos = drag?.tablePos ?? hoverTablePos ?? null
  const gestureGeometry =
    geometries.find((g) => g.pos === gestureTablePos) ?? null
  const gestureRowRects = gestureGeometry?.rowRects ?? EMPTY_RECTS

  const beginRowGesture =
    (tablePos: number, rowIndex: number, rowRects: (Rect | null)[]) =>
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!editor) return
      const table = editor.state.doc.nodeAt(tablePos)
      const lockMinIndex =
        table && table.type.name === "table"
          ? getAxisLockMinIndex(table, "row")
          : 0
      pendingRef.current = {
        axis: "row",
        from: rowIndex,
        tablePos,
        startClientX: e.clientX,
        startClientY: e.clientY,
        boundaries: collectAxisBoundaries(rowRects, lockMinIndex, "top"),
        lockMinIndex,
      }
    }

  const beginColGesture =
    (tablePos: number, colIndex: number, colRects: (Rect | null)[]) =>
    (e: React.MouseEvent) => {
      e.preventDefault()
      if (!editor) return
      const table = editor.state.doc.nodeAt(tablePos)
      const lockMinIndex =
        table && table.type.name === "table"
          ? getAxisLockMinIndex(table, "column")
          : 0
      pendingRef.current = {
        axis: "column",
        from: colIndex,
        tablePos,
        startClientX: e.clientX,
        startClientY: e.clientY,
        boundaries: collectAxisBoundaries(colRects, lockMinIndex, "left"),
        lockMinIndex,
      }
    }

  useEffect(() => {
    const container = containerRef.current
    if (!drag) {
      container?.removeAttribute(TABLE_DRAGGING_ATTR)
      return
    }
    container?.setAttribute(TABLE_DRAGGING_ATTR, "")
    const style = document.createElement("style")
    style.setAttribute("data-table-drag-handles-cursor", "")
    style.textContent = `[${TABLE_DRAGGING_ATTR}], [${TABLE_DRAGGING_ATTR}] * { cursor: grabbing !important; }`
    document.head.appendChild(style)
    return () => {
      style.remove()
      container?.removeAttribute(TABLE_DRAGGING_ATTR)
    }
  }, [drag, containerRef])

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
        if (pending.from < pending.lockMinIndex) return

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
          lockMinIndex: pending.lockMinIndex,
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

      if (pending && editor) {
        if (pending.axis === "row") {
          selectWholeRow(editor, pending.tablePos, pending.from)
        } else {
          selectWholeColumn(editor, pending.tablePos, pending.from)
        }
        return
      }

      if (!current || !editor) return

      suppressNextClickRef.current = true
      const to = resolveDropIndex({
        pointer: current.pointer,
        boundaries: current.boundaries,
        from: current.from,
        lockMinIndex: current.lockMinIndex,
      })
      if (to !== current.from) {
        // moveTableRow/moveTableColumn need a position inside the table node.
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

  const getTableBounds = (geometry: TableGeometry) => {
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

  const addRowAfter = (tablePos: number) => {
    if (!editor || editor.isDestroyed) return
    const table = editor.state.doc.nodeAt(tablePos)
    if (!table || table.type.name !== "table") return
    const map = TableMap.get(table)
    const lastRow = map.height - 1
    const cellPos = tablePos + 1 + map.positionAt(lastRow, 0, table)
    editor.chain().focus().setTextSelection(cellPos).addRowAfter().run()
  }

  const addColumnAfter = (tablePos: number) => {
    if (!editor || editor.isDestroyed) return
    const table = editor.state.doc.nodeAt(tablePos)
    if (!table || table.type.name !== "table") return
    const map = TableMap.get(table)
    const lastCol = map.width - 1
    const cellPos = tablePos + 1 + map.positionAt(0, lastCol, table)
    editor.chain().focus().setTextSelection(cellPos).addColumnAfter().run()
  }

  const onHandleClick = (
    axis: "row" | "column",
    tablePos: number,
    index: number,
  ) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    if (!editor) return
    if (axis === "row") {
      selectWholeRow(editor, tablePos, index)
      return
    }
    selectWholeColumn(editor, tablePos, index)
  }

  if (!editor) return null

  return (
    <>
      {geometries.map((geometry) => {
        const tableNode = editor.state.doc.nodeAt(geometry.pos)
        const rowLockMinIndex =
          tableNode && tableNode.type.name === "table"
            ? getAxisLockMinIndex(tableNode, "row")
            : 0
        const colLockMinIndex =
          tableNode && tableNode.type.name === "table"
            ? getAxisLockMinIndex(tableNode, "column")
            : 0
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
              const isInSelection = selectionRows.includes(i)
              const isSelected = selectionRows.length === 1 && isInSelection
              const isDragging =
                drag?.axis === "row" &&
                drag.tablePos === geometry.pos &&
                drag.from === i
              const state = resolveHandleState({
                isSelected,
                isDragging,
              })
              return (
                <RowHandle
                  key={`row-${geometry.pos}-${i}`}
                  rect={rect}
                  state={state}
                  tablePos={geometry.pos}
                  index={i}
                  isLocked={i < rowLockMinIndex}
                  onMouseDown={beginRowGesture(
                    geometry.pos,
                    i,
                    geometry.rowRects,
                  )}
                  onClick={() => onHandleClick("row", geometry.pos, i)}
                />
              )
            })}

            {geometry.colRects.map((rect, i) => {
              if (!rect) return null
              const isInSelection = selectionCols.includes(i)
              const isSelected = selectionCols.length === 1 && isInSelection
              const isDragging =
                drag?.axis === "column" &&
                drag.tablePos === geometry.pos &&
                drag.from === i
              const state = resolveHandleState({
                isSelected,
                isDragging,
              })
              return (
                <ColumnHandle
                  key={`col-${geometry.pos}-${i}`}
                  rect={rect}
                  state={state}
                  tablePos={geometry.pos}
                  index={i}
                  isLocked={i < colLockMinIndex}
                  onMouseDown={beginColGesture(
                    geometry.pos,
                    i,
                    geometry.colRects,
                  )}
                  onClick={() => onHandleClick("column", geometry.pos, i)}
                />
              )
            })}
          </Box>
        )
      })}

      {geometries.map((geometry) => {
        const bounds = getTableBounds(geometry)
        if (!bounds || hoverTablePos !== geometry.pos || drag) return null
        const addRowWidth = Math.max(bounds.width, ADD_PILL_MIN_LENGTH_PX)
        const addColHeight = Math.max(bounds.height, ADD_PILL_MIN_LENGTH_PX)
        return (
          <Box key={`add-${geometry.pos}`} as="span" display="contents">
            <AddPillButton
              axis="row"
              left={bounds.left + (bounds.width - addRowWidth) / 2}
              top={bounds.top + bounds.height + ADD_PILL_GAP_PX}
              width={addRowWidth}
              height={ADD_PILL_THICKNESS_PX}
              onClick={() => addRowAfter(geometry.pos)}
            />
            <AddPillButton
              axis="column"
              left={bounds.left + bounds.width + ADD_PILL_GAP_PX}
              top={bounds.top + (bounds.height - addColHeight) / 2}
              width={ADD_PILL_THICKNESS_PX}
              height={addColHeight}
              onClick={() => addColumnAfter(geometry.pos)}
            />
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
