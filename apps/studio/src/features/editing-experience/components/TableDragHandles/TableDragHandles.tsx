import type { Editor as TiptapEditor } from "@tiptap/react"
import type { RefObject } from "react"
import { Box } from "@chakra-ui/react"
import { useEditorState } from "@tiptap/react"
import { Fragment, useMemo, useState } from "react"
import {
  TABLE_CHROME_GAP_PX,
  TABLE_CHROME_THICKNESS_PX,
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
import {
  AddPillButton,
  AxisHandle,
  SelectTableButton,
} from "./internal/handles"
import {
  addSlotAfter,
  getSelectionHandleTarget,
  selectedIndexesFor,
  selectionTargetsEqual,
  selectWholeSlot,
  selectWholeTable,
} from "./internal/selection"
import { useAxisDragGesture } from "./internal/useAxisDragGesture"
import { useHoveredTable } from "./internal/useHoveredTable"
import { useTableGeometries } from "./internal/useTableGeometries"

const columnCenterIsVisible = (
  rect: { left: number; width: number },
  frame: { left: number; width: number },
) => {
  const center = rect.left + rect.width / 2
  return center >= frame.left && center <= frame.left + frame.width
}

export interface TableDragHandlesProps {
  editor: TiptapEditor | null
  containerRef: RefObject<HTMLElement>
  onDragStateChange?: (isDragging: boolean) => void
  expandedTablePos?: number | null
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
  expandedTablePos = null,
}: TableDragHandlesProps) => {
  const geometries = useTableGeometries(editor, containerRef)
  const visibleGeometries = useMemo(
    () =>
      expandedTablePos === null
        ? geometries
        : geometries.filter((geometry) => geometry.pos === expandedTablePos),
    [expandedTablePos, geometries],
  )
  const { drag, beginGesture, isGestureActive, consumeClickSuppression } =
    useAxisDragGesture({
      editor,
      containerRef,
      geometries: visibleGeometries,
      onDragStateChange,
    })
  const { tablePos: hoverTablePos, cornerTablePos } = useHoveredTable(
    visibleGeometries,
    containerRef,
    isGestureActive,
  )
  const [dismissedTablePos, setDismissedTablePos] = useState<number | null>(
    null,
  )
  // Stay hidden after a click until the pointer leaves this table. Resetting
  // while it is still over the table would show the button again immediately.
  if (dismissedTablePos !== null && hoverTablePos !== dismissedTablePos) {
    setDismissedTablePos(null)
  }

  const selectionTarget = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current ? getSelectionHandleTarget(current) : null,
    equalityFn: selectionTargetsEqual,
  })

  const dropIndicator = useMemo(() => {
    if (!drag) return null
    const geometry = geometryAt(visibleGeometries, drag.tablePos)
    const bounds = geometry ? getTableBounds(geometry) : null
    if (!bounds) return null
    const at =
      drag.boundaries[nearestBoundaryIndex(drag.pointer, drag.boundaries)]
    if (at === undefined) return null
    return drag.axis === "row"
      ? { left: bounds.left, top: at, width: bounds.width, height: 2 }
      : { left: at, top: bounds.top, width: 2, height: bounds.height }
  }, [drag, visibleGeometries])

  if (!editor) return null

  const onHandleClick = (axis: Axis, tablePos: number, index: number) => {
    if (consumeClickSuppression()) return
    selectWholeSlot(editor, tablePos, axis, index)
  }

  const renderAxisHandles = (geometry: TableGeometry, axis: Axis) => {
    const selected = selectedIndexesFor(selectionTarget, geometry.pos, axis)
    const rects = AXIS_VIEW[axis].rectsOf(geometry)
    const frame = geometry.frame

    return rects.map((rect, index) => {
      if (!rect) return null
      if (axis === "column" && frame && !columnCenterIsVisible(rect, frame)) {
        return null
      }
      const placed =
        axis === "row" && frame ? { ...rect, left: frame.left } : rect
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
          rect={placed}
          isActive={isActive}
          tablePos={geometry.pos}
          index={index}
          isLocked={false}
          onMouseDown={beginGesture(axis, geometry.pos, index, rects)}
          onClick={() => onHandleClick(axis, geometry.pos, index)}
        />
      )
    })
  }

  const renderSelectTableButton = (geometry: TableGeometry) => {
    const bounds = getTableBounds(geometry)
    if (
      !bounds ||
      hoverTablePos !== geometry.pos ||
      drag ||
      dismissedTablePos === geometry.pos
    ) {
      return null
    }
    return (
      <SelectTableButton
        left={bounds.left}
        top={bounds.top}
        tablePos={geometry.pos}
        isEmphasized={cornerTablePos === geometry.pos}
        onClick={() => {
          selectWholeTable(editor, geometry.pos)
          setDismissedTablePos(geometry.pos)
        }}
      />
    )
  }

  const renderAddPills = (geometry: TableGeometry) => {
    const bounds = getTableBounds(geometry)
    if (!bounds || hoverTablePos !== geometry.pos || drag) return null
    const frame = geometry.frame
    const tableLeft = bounds.left
    const tableRight = bounds.left + bounds.width
    const frameLeft = frame?.left ?? tableLeft
    const frameRight = frame ? frame.left + frame.width : tableRight
    const visibleLeft = Math.max(tableLeft, frameLeft)
    const visibleRight = Math.min(tableRight, frameRight)
    const visibleWidth = Math.max(visibleRight - visibleLeft, 0)
    const rowPillWidth = Math.max(visibleWidth, ADD_PILL_MIN_LENGTH_PX)
    const colPillHeight = Math.max(bounds.height, ADD_PILL_MIN_LENGTH_PX)
    const columnAnchor = Math.min(tableRight, frameRight)
    return (
      <>
        <AddPillButton
          axis="row"
          left={visibleLeft + (visibleWidth - rowPillWidth) / 2}
          top={bounds.top + bounds.height + TABLE_CHROME_GAP_PX}
          width={rowPillWidth}
          height={TABLE_CHROME_THICKNESS_PX}
          onClick={() => addSlotAfter(editor, geometry.pos, "row")}
        />
        <AddPillButton
          axis="column"
          left={columnAnchor + TABLE_CHROME_GAP_PX}
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
      {visibleGeometries.map((geometry) => (
        <Fragment key={geometry.pos}>
          {AXES.map((axis) => renderAxisHandles(geometry, axis))}
          {renderSelectTableButton(geometry)}
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
