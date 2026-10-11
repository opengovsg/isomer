import { Box } from "@chakra-ui/react"
import { useLayoutEffect, useRef, useState } from "react"

import { useTableColumnResizeGesture } from "./useTableColumnResizeGesture"

const columnEdgePercents = (
  table: HTMLTableElement,
  columnCount: number,
): string[] | null => {
  const rect = table.getBoundingClientRect()
  if (rect.width <= 0 || columnCount < 1) return null
  const row = table.rows[0]
  if (!row) return null

  const edges: string[] = []
  let col = 0
  for (const cell of Array.from(row.cells)) {
    const span = cell.colSpan || 1
    const cellRect = cell.getBoundingClientRect()
    const share = cellRect.width / span
    for (let i = 0; i < span && col < columnCount; i += 1) {
      const right = cellRect.left + share * (i + 1)
      const percent = ((right - rect.left) / rect.width) * 100
      edges[col] = `${percent.toFixed(2)}%`
      col += 1
    }
  }
  return col === columnCount ? edges : null
}

export const ColumnResizeHandles = ({
  columnCount,
  widths,
  contentKey,
  onDrag,
  onCommit,
}: {
  columnCount: number
  widths: number[] | null
  contentKey: string
  onDrag: (widths: number[] | null) => void
  onCommit: (widths: number[] | null) => void
}) => {
  const frameRef = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState<string[] | null>(null)
  const { activeIndex, hoverIndex, setHoverIndex, onPointerDown } =
    useTableColumnResizeGesture({ columnCount, widths, onDrag, onCommit })

  useLayoutEffect(() => {
    if (widths || columnCount < 1) return
    const table = frameRef.current
      ?.closest("[data-column-resize-root]")
      ?.querySelector("table")
    if (!(table instanceof HTMLTableElement)) return
    const next = columnEdgePercents(table, columnCount)
    setEdges((current) => (current?.join() === next?.join() ? current : next))
  }, [widths, columnCount, contentKey])

  if (columnCount < 1) return null

  const leftOf = (index: number) => {
    if (!widths) {
      return edges?.[index] ?? `${((index + 1) / columnCount) * 100}%`
    }
    const edge = widths
      .slice(0, index + 1)
      .reduce((sum, width) => sum + width, 0)
    return `${edge}px`
  }

  return (
    <Box
      ref={frameRef}
      position="absolute"
      inset={0}
      pointerEvents="none"
      contentEditable={false}
    >
      {Array.from({ length: columnCount }, (_, index) => (
        <Box
          key={index}
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize column ${index + 1}`}
          position="absolute"
          top={0}
          bottom={0}
          w="8px"
          ml="-4px"
          left={leftOf(index)}
          zIndex={3}
          pointerEvents="auto"
          cursor="col-resize"
          onPointerDown={onPointerDown(index)}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <Box
            w="2px"
            h="full"
            mx="auto"
            bg="interaction.main.default"
            opacity={hoverIndex === index || activeIndex === index ? 1 : 0}
            pointerEvents="none"
          />
        </Box>
      ))}
    </Box>
  )
}
