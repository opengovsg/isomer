import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject, MouseEvent as ReactMouseEvent } from "react"
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
import {
  BiDotsHorizontalRounded,
  BiDotsVerticalRounded,
  BiPlus,
} from "react-icons/bi"
import {
  ADD_PILL_GAP_PX,
  ADD_PILL_MIN_LENGTH_PX,
  ADD_PILL_THICKNESS_PX,
  COL_HANDLE,
  HANDLE_BORDER_PX,
  HANDLE_BORDER_RADIUS_PX,
  HANDLE_GAP_PX,
  HANDLE_ICON_PX,
  HANDLE_MARGIN_PX,
  isPointerInTableChrome,
  ROW_HANDLE,
} from "~/features/editing-experience/utils/tableEditorChrome"
import {
  containerRectToViewportRect,
  type Rect,
  viewportPointToContainerPoint,
  viewportRectToContainerRect,
} from "~/features/editing-experience/utils/tableEditorGeometry"

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
}

interface PendingGesture {
  axis: "row" | "column"
  from: number
  tablePos: number
  startClientX: number
  startClientY: number
  boundaries: number[]
}

const DRAG_THRESHOLD_PX = 4
const EMPTY_RECTS: (Rect | null)[] = []
const EMPTY_INDEXES: number[] = []
const EMPTY_GEOMETRIES: TableGeometry[] = []

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

type HandleVisualState = "passive" | "hover" | "selected" | "dragging"

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
  isHovered,
}: {
  isSelected: boolean
  isDragging: boolean
  isHovered: boolean
}): HandleVisualState => {
  if (isDragging) return "dragging"
  if (isSelected) return "selected"
  if (isHovered) return "hover"
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
        bg: "base.canvas.alt",
        borderColor: "base.divider.medium",
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
  borderRadius: `${HANDLE_BORDER_RADIUS_PX}px`,
  userSelect: "none",
  zIndex: "2",
  boxSizing: "border-box",
  lineHeight: 0,
  transition: "background-color 0.15s, border-color 0.15s, color 0.15s",
} as const

const EllipsisIcon = ({ axis }: { axis: "row" | "column" }) => (
  <Icon
    as={axis === "row" ? BiDotsVerticalRounded : BiDotsHorizontalRounded}
    fontSize={`${HANDLE_ICON_PX}px`}
    aria-hidden
  />
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
}) => (
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
    bg="base.canvas.alt"
    border="1px solid"
    borderColor="base.divider.medium"
    borderRadius="full"
    color="base.content.medium"
    cursor="pointer"
    zIndex="2"
    transition="background-color 0.15s, border-color 0.15s"
    aria-label={axis === "row" ? "Add row below" : "Add column to the right"}
    data-table-add-handle={axis}
    sx={{
      _hover: {
        bg: "base.divider.medium",
        borderColor: "base.divider.strong",
      },
    }}
    onMouseDown={(event: ReactMouseEvent) => event.preventDefault()}
    onClick={onClick}
  >
    <Icon as={BiPlus} fontSize="0.875rem" aria-hidden />
  </Box>
)

const RowHandle = ({
  rect,
  state,
  tablePos,
  index,
  onMouseDown,
}: {
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  onMouseDown: (e: React.MouseEvent) => void
}) => (
  <Box
    position="absolute"
    left={`${rect.left - HANDLE_GAP_PX - ROW_HANDLE.w}px`}
    top={`${rect.top + (rect.height - ROW_HANDLE.h) / 2}px`}
    {...handleBaseStyle}
    {...handleChromeByState(state)}
    w={`${ROW_HANDLE.w}px`}
    h={`${ROW_HANDLE.h}px`}
    onMouseDown={onMouseDown}
    title="Select or drag to reorder row"
    aria-label="Drag to reorder row"
    role="button"
    data-state={state}
    data-table-drag-handle="row"
    data-table-pos={tablePos}
    data-index={index}
  >
    <EllipsisIcon axis="row" />
  </Box>
)

const ColumnHandle = ({
  rect,
  state,
  tablePos,
  index,
  onMouseDown,
}: {
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  onMouseDown: (e: React.MouseEvent) => void
}) => (
  <Box
    position="absolute"
    top={`${rect.top - HANDLE_GAP_PX - COL_HANDLE.h}px`}
    left={`${rect.left + (rect.width - COL_HANDLE.w) / 2}px`}
    {...handleBaseStyle}
    {...handleChromeByState(state)}
    w={`${COL_HANDLE.w}px`}
    h={`${COL_HANDLE.h}px`}
    onMouseDown={onMouseDown}
    title="Select or drag to reorder column"
    aria-label="Drag to reorder column"
    role="button"
    data-state={state}
    data-table-drag-handle="column"
    data-table-pos={tablePos}
    data-index={index}
  >
    <EllipsisIcon axis="column" />
  </Box>
)

export const TableDragHandles = ({
  editor,
  containerRef,
  onDragStateChange,
}: TableDragHandlesProps) => {
  const [hoverTablePos, setHoverTablePos] = useState<number | null>(null)
  const [hoverRow, setHoverRow] = useState<number | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<PendingGesture | null>(null)

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

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
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
        const tableRects = geometry.rowRects.filter((r): r is Rect => !!r)
        const firstRowRect = tableRects[0]
        const lastRowRect = tableRects[tableRects.length - 1]
        let inChrome = false
        if (firstRowRect && lastRowRect) {
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
          inChrome = isPointerInTableChrome({
            clientX,
            clientY,
            tableLeft,
            tableTop,
            tableRight,
            tableBottom,
          })
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
              clientY >= tableTop - HANDLE_MARGIN_PX &&
              clientY <= tableBottom
            ) {
              colHit = i
            }
          })
        }

        if (rowHit !== null || colHit !== null || inChrome) {
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
    if (rowRects.length === 0 || colRects.length === 0) return null
    const top = rowRects[0]!.top
    const left = colRects[0]!.left
    const bottom =
      rowRects[rowRects.length - 1]!.top + rowRects[rowRects.length - 1]!.height
    const right =
      colRects[colRects.length - 1]!.left + colRects[colRects.length - 1]!.width
    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
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
                isHovered,
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
                isHovered,
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
                />
              )
            })}
          </Box>
        )
      })}

      {visibleGeometries.map((geometry) => {
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
