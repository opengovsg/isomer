import { Box } from "@chakra-ui/react"

import type { ColumnBoundaryTarget } from "./columnResize"
import {
  TABLE_COLUMN_RESIZE_HIT_PX,
  TABLE_COLUMN_RESIZE_LINE_PX,
} from "./columnResize"
import type { ColumnResizeLine } from "./useColumnResizeGesture"

const ResizeLine = ({ line }: { line: ColumnResizeLine }) => (
  <Box
    position="absolute"
    left={`${line.left - TABLE_COLUMN_RESIZE_LINE_PX / 2}px`}
    top={`${line.top}px`}
    width={`${TABLE_COLUMN_RESIZE_LINE_PX}px`}
    height={`${line.height}px`}
    bg="interaction.link-main-default"
    pointerEvents="none"
    zIndex={4}
  />
)

export const ColumnResizeOverlay = ({
  targets,
  hoverLine,
  dragLine,
  onGripMouseDown,
  onGripMouseEnter,
  onGripMouseLeave,
}: {
  targets: ColumnBoundaryTarget[]
  hoverLine: ColumnResizeLine | null
  dragLine: ColumnResizeLine | null
  onGripMouseDown: (
    target: ColumnBoundaryTarget,
  ) => (event: React.MouseEvent) => void
  onGripMouseEnter: (target: ColumnBoundaryTarget) => () => void
  onGripMouseLeave: () => void
}) => (
  <>
    {targets.map((target) => (
      <Box
        key={`${target.tablePos}-${target.columnIndex}`}
        position="absolute"
        left={`${target.lineLeft - TABLE_COLUMN_RESIZE_HIT_PX / 2}px`}
        top={`${target.top}px`}
        width={`${TABLE_COLUMN_RESIZE_HIT_PX}px`}
        height={`${target.height}px`}
        cursor="col-resize"
        zIndex={3}
        onMouseDown={onGripMouseDown(target)}
        onMouseEnter={onGripMouseEnter(target)}
        onMouseLeave={onGripMouseLeave}
      />
    ))}
    {hoverLine && !dragLine && <ResizeLine line={hoverLine} />}
    {dragLine && <ResizeLine line={dragLine} />}
  </>
)
