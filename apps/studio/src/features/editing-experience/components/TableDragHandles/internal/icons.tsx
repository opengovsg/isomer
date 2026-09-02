import type { IconBaseProps } from "react-icons"
import { ADD_PILL_ICON_FILL } from "~/features/editing-experience/utils/tableEditorChrome"

const DOT_RADIUS = 5 / 3
const DOT_SPACING = 5
const DOT_OFFSETS = [0, 1, 2].map((i) => DOT_RADIUS + i * DOT_SPACING)
const DOTS_LONG_PX = 14
const DOTS_SHORT_PX = 4

/**
 * The three-dot grip on a drag handle. Both orientations are the same circles
 * with their coordinates transposed, so the shape is described once.
 *
 * Inherits its colour from the handle via `currentColor` — that is what drives
 * the passive/hover/selected states, so callers should not set `fill`.
 */
export const DotsIcon = ({
  orientation,
  ...props
}: IconBaseProps & { orientation: "vertical" | "horizontal" }) => {
  const isVertical = orientation === "vertical"
  const width = isVertical ? DOTS_SHORT_PX : DOTS_LONG_PX
  const height = isVertical ? DOTS_LONG_PX : DOTS_SHORT_PX
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
      style={{ flexShrink: 0 }}
      {...props}
    >
      {DOT_OFFSETS.map((offset) => (
        <circle
          key={offset}
          cx={isVertical ? DOT_RADIUS : offset}
          cy={isVertical ? offset : DOT_RADIUS}
          r={DOT_RADIUS}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

export const PlusIcon = ({
  size,
  ...props
}: IconBaseProps & { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden
    style={{ flexShrink: 0 }}
    {...props}
  >
    <path
      d="M9.5 5.5H6.5V2.5H5.5V5.5H2.5V6.5H5.5V9.5H6.5V6.5H9.5V5.5Z"
      fill={ADD_PILL_ICON_FILL}
    />
  </svg>
)
