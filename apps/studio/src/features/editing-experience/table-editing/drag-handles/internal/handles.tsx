import type { MouseEvent as ReactMouseEvent } from "react"
import { Box, Icon } from "@chakra-ui/react"
import {
  BiDotsHorizontalRounded,
  BiDotsVerticalRounded,
  BiPlus,
} from "react-icons/bi"
import { TABLE_CHROME_GAP_PX } from "~/features/editing-experience/table-editing/chrome/tableEditorChrome"

import type { Axis } from "../../axis/types"
import type { Rect } from "./axisMath"
import { AXIS_VIEW } from "./axisView"
import {
  ADD_PILL_ICON_SIZE_PX,
  ADD_PILL_RADIUS_PX,
  HANDLE_BORDER_RADIUS_PX,
} from "./chrome"

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

// tiptap.scss sets grabbing on the whole editor during drag, so idle cursors are set here only.
const handleChrome = (isActive: boolean, isLocked: boolean) => ({
  cursor: isLocked ? "pointer" : "grab",
  sx: {
    appearance: "none",
    WebkitAppearance: "none",
    backgroundColor: isActive ? "interaction.main.default" : "white",
    color: isActive ? "white" : "interaction.support.unselected",
    _hover: isActive
      ? { backgroundColor: "interaction.main.default", color: "white" }
      : {
          backgroundColor: "interaction.muted.main.hover",
          color: "base.content.medium",
        },
  },
})

/** Gutter handle for one row or column slot. */
export const AxisHandle = ({
  axis,
  rect,
  isActive,
  tablePos,
  index,
  isLocked,
  onMouseDown,
  onClick,
}: {
  axis: Axis
  rect: Rect
  /** Selected, or the slot currently being dragged. */
  isActive: boolean
  tablePos: number
  index: number
  isLocked: boolean
  onMouseDown: (event: ReactMouseEvent) => void
  onClick: () => void
}) => {
  const { handle } = AXIS_VIEW[axis]
  const isRow = axis === "row"
  return (
    <Box
      as="button"
      type="button"
      position="absolute"
      left={`${
        isRow
          ? rect.left - TABLE_CHROME_GAP_PX - handle.w
          : rect.left + (rect.width - handle.w) / 2
      }px`}
      top={`${
        isRow
          ? rect.top + (rect.height - handle.h) / 2
          : rect.top - TABLE_CHROME_GAP_PX - handle.h
      }px`}
      {...handleBaseStyle}
      {...handleChrome(isActive, isLocked)}
      w={`${handle.w}px`}
      h={`${handle.h}px`}
      onMouseDown={onMouseDown}
      onClick={onClick}
      title={isLocked ? `Select ${axis}` : `Select or drag to reorder ${axis}`}
      aria-label={isLocked ? `Select ${axis}` : `Drag to reorder ${axis}`}
      data-state={isActive ? "selected" : "passive"}
      data-table-drag-handle={axis}
      data-table-pos={tablePos}
      data-index={index}
    >
      {isRow ? (
        <BiDotsVerticalRounded aria-hidden />
      ) : (
        <BiDotsHorizontalRounded aria-hidden />
      )}
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
    aria-label={AXIS_VIEW[axis].addPillLabel}
    data-table-add-handle={axis}
    sx={{
      appearance: "none",
      WebkitAppearance: "none",
      backgroundColor: "interaction.neutral-subtle.default",
      _hover: { backgroundColor: "interaction.neutral-subtle.hover" },
    }}
    onMouseDown={(event: ReactMouseEvent) => event.preventDefault()}
    onClick={onClick}
  >
    <Icon
      as={BiPlus}
      aria-hidden
      boxSize={`${ADD_PILL_ICON_SIZE_PX}px`}
      color="grey.900"
    />
  </Box>
)
