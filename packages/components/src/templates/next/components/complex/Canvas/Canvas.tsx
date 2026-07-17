import type { CanvasProps } from "~/interfaces"
import { CANVAS_GRID_COLUMNS } from "~/interfaces"

import { renderComponent } from "../../../render/renderComponent"

// Blocks without any column placement keep the previous stacked behaviour by
// spanning the full grid width. A span is clamped so a block starting late in
// the grid cannot spill past the last column.
const getGridColumn = (colStart?: number, colSpan?: number): string => {
  if (colStart !== undefined) {
    const maxSpan = CANVAS_GRID_COLUMNS + 1 - colStart
    return colSpan !== undefined
      ? `${colStart} / span ${Math.min(colSpan, maxSpan)}`
      : `${colStart} / -1`
  }

  return colSpan !== undefined
    ? `span ${Math.min(colSpan, CANVAS_GRID_COLUMNS)}`
    : "1 / -1"
}

const getGridRow = (
  rowStart?: number,
  rowSpan?: number,
): string | undefined => {
  if (rowStart !== undefined) {
    return rowSpan !== undefined
      ? `${rowStart} / span ${rowSpan}`
      : `${rowStart}`
  }

  return rowSpan !== undefined ? `span ${rowSpan}` : undefined
}

export const Canvas = ({
  blocks,
  width,
  height,
  layout,
  site,
  shouldLazyLoad,
  permalink,
}: CanvasProps) => {
  return (
    <div
      className="grid resize auto-rows-[minmax(2rem,auto)] grid-cols-12 gap-4 overflow-auto rounded-lg border border-divider-medium p-5 [&:not(:first-child)]:mt-7"
      // Scrollable region must be keyboard-focusable (same as Table.tsx)
      tabIndex={0}
      style={{
        width: width !== undefined ? `${width}%` : undefined,
        height: height !== undefined ? `${height}px` : undefined,
      }}
    >
      {blocks.map((block, index) => (
        <div
          key={index}
          style={{
            gridColumn: getGridColumn(block.colStart, block.colSpan),
            gridRow: getGridRow(block.rowStart, block.rowSpan),
          }}
        >
          {renderComponent({
            elementKey: index,
            component: block,
            layout,
            site,
            shouldLazyLoad,
            permalink,
          })}
        </div>
      ))}
    </div>
  )
}
