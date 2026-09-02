import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box } from "@chakra-ui/react"
import { useEditorState } from "@tiptap/react"
import { useMemo } from "react"
import {
  ADD_PILL_GAP_PX,
  ADD_PILL_MIN_LENGTH_PX,
  ADD_PILL_THICKNESS_PX,
} from "~/features/editing-experience/utils/tableEditorChrome"

import type { TableGeometry } from "./internal/axisMath"
import type { Axis } from "./internal/axisView"
import {
  getRowSpan,
  getTableBounds,
  nearestBoundaryIndex,
} from "./internal/axisMath"
import { getAxisLockMinIndex } from "./internal/axisTableOps"
import { AXES, AXIS_VIEW } from "./internal/axisView"
import {
  AddPillButton,
  AxisHandle,
  resolveHandleState,
} from "./internal/handles"
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
    const geometry = geometries.find((g) => g.pos === drag.tablePos)
    const span = geometry ? getRowSpan(geometry.rowRects) : null
    if (!span) return null
    const at =
      drag.boundaries[nearestBoundaryIndex(drag.pointer, drag.boundaries)]
    if (at === undefined) return null
    return drag.axis === "row"
      ? { left: span.left, top: at, width: span.width, height: 2 }
      : { left: at, top: span.top, width: 2, height: span.height }
  }, [drag, geometries])

  if (!editor) return null

  const onHandleClick = (axis: Axis, tablePos: number, index: number) => {
    if (consumeClickSuppression()) return
    selectWholeSlot(editor, tablePos, axis, index)
  }

  const renderAxisHandles = (geometry: TableGeometry, axis: Axis) => {
    const lockMinIndex = getAxisLockMinIndex(
      editor.state.doc,
      geometry.pos,
      axis,
    )
    const selected = selectedIndexesFor(selectionTarget, geometry.pos, axis)
    const rects = AXIS_VIEW[axis].rectsOf(geometry)

    return rects.map((rect, index) => {
      if (!rect) return null
      const state = resolveHandleState({
        // A multi-slot selection leaves every handle passive.
        isSelected: selected.length === 1 && selected.includes(index),
        isDragging:
          drag?.axis === axis &&
          drag.tablePos === geometry.pos &&
          drag.from === index,
      })
      return (
        <AxisHandle
          key={`${axis}-${geometry.pos}-${index}`}
          axis={axis}
          rect={rect}
          state={state}
          tablePos={geometry.pos}
          index={index}
          isLocked={index < lockMinIndex}
          onMouseDown={beginGesture(axis, geometry.pos, index, rects)}
          onClick={() => onHandleClick(axis, geometry.pos, index)}
        />
      )
    })
  }

  const renderAddPills = (geometry: TableGeometry) => {
    const bounds = getTableBounds(geometry)
    if (!bounds || hoverTablePos !== geometry.pos || drag) return null
    const rowPillWidth = Math.max(bounds.width, ADD_PILL_MIN_LENGTH_PX)
    const colPillHeight = Math.max(bounds.height, ADD_PILL_MIN_LENGTH_PX)
    return (
      <>
        <AddPillButton
          axis="row"
          left={bounds.left + (bounds.width - rowPillWidth) / 2}
          top={bounds.top + bounds.height + ADD_PILL_GAP_PX}
          width={rowPillWidth}
          height={ADD_PILL_THICKNESS_PX}
          onClick={() => addSlotAfter(editor, geometry.pos, "row")}
        />
        <AddPillButton
          axis="column"
          left={bounds.left + bounds.width + ADD_PILL_GAP_PX}
          top={bounds.top + (bounds.height - colPillHeight) / 2}
          width={ADD_PILL_THICKNESS_PX}
          height={colPillHeight}
          onClick={() => addSlotAfter(editor, geometry.pos, "column")}
        />
      </>
    )
  }

  return (
    <>
      {geometries.map((geometry) => (
        <Box key={`table-${geometry.pos}`} as="span" display="contents">
          {AXES.map((axis) => renderAxisHandles(geometry, axis))}
          {renderAddPills(geometry)}
        </Box>
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
