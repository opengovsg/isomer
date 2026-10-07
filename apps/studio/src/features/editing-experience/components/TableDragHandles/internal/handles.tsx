import type { MouseEvent as ReactMouseEvent } from "react"
import { Box, Flex, Icon } from "@chakra-ui/react"
import { BiBorderAll } from "react-icons/bi"
import { IconTableDragDots, IconTableDragPlus } from "~/components/icons"
import { TABLE_CHROME_GAP_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import type { Rect } from "./axisMath"
import type { Axis } from "./axisView"
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

// While a drag is in flight `tiptap.scss` forces `grabbing` on everything in
// the editor container, so only the idle cursors are set here.
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

/** `left` and `top` are the table's top-left corner, in container coordinates. */
export const SelectTableButton = ({
  left,
  top,
  tablePos,
  onClick,
}: {
  left: number
  top: number
  tablePos: number
  onClick: () => void
}) => (
  <Flex
    as="button"
    type="button"
    aria-label="Select entire table"
    data-table-select
    data-table-pos={tablePos}
    position="absolute"
    left={`${left}px`}
    top={`${top}px`}
    transform="translate(-50%, -50%)"
    zIndex="4"
    p="0.5rem"
    borderRadius="full"
    cursor="pointer"
    bg="base.canvas.default"
    boxShadow="0 0 10px 0 rgba(191, 191, 191, 0.50)"
    transition="background-color 0.15s, box-shadow 0.15s"
    sx={{
      appearance: "none",
      WebkitAppearance: "none",
      border: "0",
      _hover: {
        boxShadow: "0 0 12px 0 rgba(191, 191, 191, 0.65)",
        bg: "interaction.main-subtle.default",
      },
    }}
    onMouseDown={(event: ReactMouseEvent) => event.preventDefault()}
    onClick={onClick}
  >
    <Icon
      as={BiBorderAll}
      aria-hidden
      fontSize="0.75rem"
      color="interaction.main.default"
    />
  </Flex>
)

/** Sits in the gutter beside the slot it controls, centred on its length. */
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
      <IconTableDragDots orientation={isRow ? "vertical" : "horizontal"} />
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
    <IconTableDragPlus size={ADD_PILL_ICON_SIZE_PX} />
  </Box>
)
