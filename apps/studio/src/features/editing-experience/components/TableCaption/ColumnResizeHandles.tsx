import { Box } from "@chakra-ui/react"

import { useTableColumnResizeGesture } from "./useTableColumnResizeGesture"

export const ColumnResizeHandles = ({
  columnCount,
  widths,
  onDrag,
  onCommit,
}: {
  columnCount: number
  widths: number[] | null
  onDrag: (widths: number[] | null) => void
  onCommit: (widths: number[] | null) => void
}) => {
  const { activeIndex, hoverIndex, setHoverIndex, onPointerDown } =
    useTableColumnResizeGesture({ columnCount, widths, onDrag, onCommit })

  if (columnCount < 1) return null

  const leftOf = (index: number) => {
    if (!widths) return `${((index + 1) / columnCount) * 100}%`
    const edge = widths
      .slice(0, index + 1)
      .reduce((sum, width) => sum + width, 0)
    return `${edge}px`
  }

  return (
    <Box
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
