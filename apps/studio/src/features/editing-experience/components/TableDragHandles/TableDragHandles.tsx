import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box } from "@chakra-ui/react"
import { useEditorState } from "@tiptap/react"
import { Fragment, useMemo } from "react"
import {
  TABLE_CHROME_GAP_PX,
  TABLE_CHROME_THICKNESS_PX,
  TABLE_GUTTER_PX,
} from "~/features/editing-experience/utils/tableEditorChrome"

import type { TableGeometry } from "./internal/axisMath"
import type { Axis } from "./internal/axisView"
import {
  geometryAt,
  getTableBounds,
  nearestBoundaryIndex,
} from "./internal/axisMath"
import { AXES, AXIS_VIEW } from "./internal/axisView"
import { ADD_PILL_MIN_LENGTH_PX } from "./internal/chrome"
import { AddPillButton, AxisHandle } from "./internal/handles"
import {
  addSlotAfter,
  getSelectionHandleTarget,
  selectedIndexesFor,
  selectionTargetsEqual,
  selectWholeSlot,
} from "./internal/selection"
import { useAxisDragGesture } from "./internal/useAxisDragGesture"
import { useHoveredTable } from "./internal/useHoveredTable"
import { useTableGeometries } from "./internal/useTableGeometries"

const scrollPortBox = (
  scroller: HTMLElement,
  container: HTMLElement,
): { left: number; right: number } => {
  const scrollerRect = scroller.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const left = scrollerRect.left - containerRect.left + container.scrollLeft
  return { left, right: left + scroller.clientWidth }
}

/** Column handles track their cells, but stay inside the frame so they cannot cover the side lanes. */
const fitsInScrollPort = (
  rect: { left: number; width: number },
  port: { left: number; right: number },
): boolean => {
  const handleWidth = AXIS_VIEW.column.handle.w
  const handleLeft = rect.left + (rect.width - handleWidth) / 2
  return (
    handleLeft >= port.left - 0.5 &&
    handleLeft + handleWidth <= port.right + 0.5
  )
}

export interface TableDragHandlesProps {
  editor: TiptapEditor | null
  containerRef: RefObject<HTMLElement>
  onDragStateChange?: (isDragging: boolean) => void
}

/**
 * Row and column handles rendered in the gutter around every table, for
 * selecting an axis or dragging it to a new position. Positioned absolutely
 * against `containerRef`, which must be a positioned ancestor of the editor.
 */
export const TableDragHandles = ({
  editor,
  containerRef,
  onDragStateChange,
}: TableDragHandlesProps) => {
  const geometries = useTableGeometries(editor, containerRef)
  const { drag, beginGesture, isGestureActive, consumeClickSuppression } =
    useAxisDragGesture({ editor, containerRef, geometries, onDragStateChange })
  const hoverTablePos = useHoveredTable(
    geometries,
    containerRef,
    isGestureActive,
  )

  const selectionTarget = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current ? getSelectionHandleTarget(current) : null,
    equalityFn: selectionTargetsEqual,
  })

  const dropIndicator = useMemo(() => {
    if (!drag) return null
    const geometry = geometryAt(geometries, drag.tablePos)
    const bounds = geometry ? getTableBounds(geometry) : null
    if (!bounds) return null
    const at =
      drag.boundaries[nearestBoundaryIndex(drag.pointer, drag.boundaries)]
    if (at === undefined) return null
    return drag.axis === "row"
      ? { left: bounds.left, top: at, width: bounds.width, height: 2 }
      : { left: at, top: bounds.top, width: 2, height: bounds.height }
  }, [drag, geometries])

  if (!editor) return null

  const onHandleClick = (axis: Axis, tablePos: number, index: number) => {
    if (consumeClickSuppression()) return
    selectWholeSlot(editor, tablePos, axis, index)
  }

  const horizontalScrollerFor = (tablePos: number): HTMLElement | null => {
    const nodeDom = editor.view.nodeDOM(tablePos)
    if (!(nodeDom instanceof HTMLElement)) return null
    const scroller = nodeDom.querySelector("[data-table-h-scroll]")
    return scroller instanceof HTMLElement ? scroller : null
  }

  const renderAxisHandles = (geometry: TableGeometry, axis: Axis) => {
    const selected = selectedIndexesFor(selectionTarget, geometry.pos, axis)
    const rects = AXIS_VIEW[axis].rectsOf(geometry)
    const scroller = horizontalScrollerFor(geometry.pos)
    const container = containerRef.current
    const port =
      scroller && container ? scrollPortBox(scroller, container) : null
    // Row handles live in the left lane, outside the scroller, so they stay
    // put while cells scroll inside the frame.
    const rowHandleLeft =
      axis === "row" && port ? port.left - TABLE_GUTTER_PX : undefined

    return rects.map((rect, index) => {
      if (!rect) return null
      if (axis === "column" && port && !fitsInScrollPort(rect, port)) {
        return null
      }
      const isActive =
        // A multi-slot selection leaves every handle passive.
        (selected.length === 1 && selected.includes(index)) ||
        (drag?.axis === axis &&
          drag.tablePos === geometry.pos &&
          drag.from === index)
      return (
        <AxisHandle
          key={`${axis}-${geometry.pos}-${index}`}
          axis={axis}
          rect={rect}
          isActive={isActive}
          tablePos={geometry.pos}
          index={index}
          isLocked={false}
          left={rowHandleLeft}
          onMouseDown={beginGesture(axis, geometry.pos, index, rects)}
          onClick={() => onHandleClick(axis, geometry.pos, index)}
        />
      )
    })
  }

  const renderAddPills = (geometry: TableGeometry) => {
    const bounds = getTableBounds(geometry)
    const container = containerRef.current
    if (!bounds || !container || hoverTablePos !== geometry.pos || drag) {
      return null
    }
    const editorLeft = container.scrollLeft
    const editorWidth = container.clientWidth
    const nodeDom = editor.view.nodeDOM(geometry.pos)
    const scrollPort =
      nodeDom instanceof HTMLElement
        ? nodeDom.querySelector("[data-table-h-scroll]")
        : null
    const port =
      scrollPort instanceof HTMLElement
        ? scrollPortBox(scrollPort, container)
        : null
    // The fixed frame between the side lanes. Inner scroll does not move it.
    const assignedLeft = port ? port.left : bounds.left
    const assignedWidth = port
      ? Math.max(port.right - port.left, ADD_PILL_MIN_LENGTH_PX)
      : Math.max(bounds.width, ADD_PILL_MIN_LENGTH_PX)
    const colPillHeight = Math.max(bounds.height, ADD_PILL_MIN_LENGTH_PX)
    const besideTable = bounds.left + bounds.width + TABLE_CHROME_GAP_PX
    const frameRight = port
      ? port.right + TABLE_CHROME_GAP_PX
      : editorLeft + editorWidth - TABLE_CHROME_THICKNESS_PX
    // In the right lane when the table fills the frame. Beside a narrower table.
    const columnPillLeft = Math.min(besideTable, frameRight)
    return (
      <>
        <AddPillButton
          axis="row"
          left={assignedLeft}
          top={bounds.top + bounds.height + TABLE_CHROME_GAP_PX}
          width={assignedWidth}
          height={TABLE_CHROME_THICKNESS_PX}
          onClick={() => addSlotAfter(editor, geometry.pos, "row")}
        />
        <AddPillButton
          axis="column"
          left={columnPillLeft}
          top={bounds.top + (bounds.height - colPillHeight) / 2}
          width={TABLE_CHROME_THICKNESS_PX}
          height={colPillHeight}
          onClick={() => addSlotAfter(editor, geometry.pos, "column")}
        />
      </>
    )
  }

  return (
    <>
      {geometries.map((geometry) => (
        <Fragment key={geometry.pos}>
          {AXES.map((axis) => renderAxisHandles(geometry, axis))}
          {renderAddPills(geometry)}
        </Fragment>
      ))}

      {dropIndicator && (
        <Box
          position="absolute"
          left={`${dropIndicator.left}px`}
          top={`${dropIndicator.top}px`}
          w={`${dropIndicator.width}px`}
          h={`${dropIndicator.height}px`}
          bg="interaction.main.default"
          zIndex="3"
          pointerEvents="none"
        />
      )}
    </>
  )
}
