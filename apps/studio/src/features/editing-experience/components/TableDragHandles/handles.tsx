import type { MouseEvent as ReactMouseEvent } from "react"
import type { Rect } from "~/features/editing-experience/utils/tableEditorGeometry"
import { Box } from "@chakra-ui/react"
import {
  ADD_PILL_HOVER_BG,
  ADD_PILL_ICON_SIZE_PX,
  ADD_PILL_IDLE_BG,
  ADD_PILL_RADIUS_PX,
  HANDLE_ACTIVE_BG,
  HANDLE_BORDER_RADIUS_PX,
  HANDLE_GAP_PX,
} from "~/features/editing-experience/utils/tableEditorChrome"

import type { Axis } from "./axis"
import { AXIS } from "./axis"
import { DotsIcon, PlusIcon } from "./icons"

export type HandleVisualState = "passive" | "selected" | "dragging"

export const resolveHandleState = ({
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

const handleChromeByState = (state: HandleVisualState, isLocked: boolean) => {
  const isActive = state === "selected" || state === "dragging"
  const cursor = isLocked
    ? "pointer"
    : state === "dragging"
      ? "grabbing"
      : "grab"
  return {
    cursor,
    sx: {
      appearance: "none",
      WebkitAppearance: "none",
      backgroundColor: isActive ? HANDLE_ACTIVE_BG : "white",
      color: isActive ? "white" : "interaction.support.unselected",
      _hover: isActive
        ? { backgroundColor: HANDLE_ACTIVE_BG, color: "white" }
        : {
            backgroundColor: "interaction.muted.main.hover",
            color: "base.content.medium",
          },
    },
  }
}

/** Sits in the gutter beside the slot it controls, centred on its length. */
export const AxisHandle = ({
  axis,
  rect,
  state,
  tablePos,
  index,
  isLocked,
  onMouseDown,
  onClick,
}: {
  axis: Axis
  rect: Rect
  state: HandleVisualState
  tablePos: number
  index: number
  isLocked: boolean
  onMouseDown: (event: ReactMouseEvent) => void
  onClick: () => void
}) => {
  const { handle, selectLabel, dragLabel } = AXIS[axis]
  const isRow = axis === "row"
  return (
    <Box
      as="button"
      type="button"
      position="absolute"
      left={`${
        isRow
          ? rect.left - HANDLE_GAP_PX - handle.w
          : rect.left + (rect.width - handle.w) / 2
      }px`}
      top={`${
        isRow
          ? rect.top + (rect.height - handle.h) / 2
          : rect.top - HANDLE_GAP_PX - handle.h
      }px`}
      {...handleBaseStyle}
      {...handleChromeByState(state, isLocked)}
      w={`${handle.w}px`}
      h={`${handle.h}px`}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={isLocked ? selectLabel : `Select or drag to reorder ${axis}`}
      aria-label={isLocked ? selectLabel : dragLabel}
      data-state={state}
      data-table-drag-handle={axis}
      data-table-pos={tablePos}
      data-index={index}
    >
      <DotsIcon orientation={isRow ? "vertical" : "horizontal"} />
    </Box>
  )
}

export const AddPillButton = ({
  axis,
  left,
  top,
  width,
  height,
  onClick,
}: {
  axis: Axis
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
    border="0"
    borderRadius={`${ADD_PILL_RADIUS_PX}px`}
    cursor="pointer"
    zIndex="2"
    transition="background-color 0.15s"
    aria-label={AXIS[axis].addPillLabel}
    data-table-add-handle={axis}
    sx={{
      appearance: "none",
      WebkitAppearance: "none",
      backgroundColor: ADD_PILL_IDLE_BG,
      _hover: { backgroundColor: ADD_PILL_HOVER_BG },
    }}
    onMouseDown={(event: ReactMouseEvent) => event.preventDefault()}
    onClick={onClick}
  >
    <PlusIcon size={ADD_PILL_ICON_SIZE_PX} />
  </Box>
)
