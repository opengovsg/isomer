import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { CanvasBlockPlacementProps } from "@opengovsg/isomer-components"
import { Box, FormControl, Grid, HStack, Text } from "@chakra-ui/react"
import { and, isObjectControl, rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { Button, FormLabel } from "@opengovsg/design-system-react"
import { CANVAS_GRID_COLUMNS } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

export const jsonFormsCanvasPlacementControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CanvasPlacementControl,
  and(
    isObjectControl,
    schemaMatches((schema) => schema.format === "canvasPlacement"),
  ),
)

// Always show enough rows to drag out a tall block; the grid grows as the
// selection approaches the bottom edge
const MIN_DISPLAYED_ROWS = 8

interface GridCell {
  row: number
  col: number
}

const toPlacement = (
  anchor: GridCell,
  current: GridCell,
): CanvasBlockPlacementProps => ({
  colStart: Math.min(anchor.col, current.col),
  colSpan: Math.abs(anchor.col - current.col) + 1,
  rowStart: Math.min(anchor.row, current.row),
  rowSpan: Math.abs(anchor.row - current.row) + 1,
})

// A partial placement (possible in hand-authored content) renders with the
// same defaults the canvas renderer applies: start at the first cell, span
// the full width and a single row
const normalise = (placement: CanvasBlockPlacementProps) => {
  const colStart = placement.colStart ?? 1
  const rowStart = placement.rowStart ?? 1
  return {
    colStart,
    colEnd:
      colStart + (placement.colSpan ?? CANVAS_GRID_COLUMNS + 1 - colStart) - 1,
    rowStart,
    rowEnd: rowStart + (placement.rowSpan ?? 1) - 1,
  }
}

function JsonFormsCanvasPlacementControl({
  data,
  label,
  description,
  handleChange,
  path,
  visible,
  enabled,
}: ControlProps) {
  const placement = data as CanvasBlockPlacementProps | undefined
  const [dragAnchor, setDragAnchor] = useState<GridCell | null>(null)
  const [dragCurrent, setDragCurrent] = useState<GridCell | null>(null)

  // Committing on window mouseup lets a drag end anywhere (even outside the
  // grid) and still apply the last cell the pointer covered
  useEffect(() => {
    if (!dragAnchor || !dragCurrent) {
      return
    }
    const commitDrag = () => {
      handleChange(path, toPlacement(dragAnchor, dragCurrent))
      setDragAnchor(null)
      setDragCurrent(null)
    }
    window.addEventListener("mouseup", commitDrag)
    return () => window.removeEventListener("mouseup", commitDrag)
  }, [dragAnchor, dragCurrent, handleChange, path])

  if (!visible) {
    return null
  }

  const selection =
    dragAnchor && dragCurrent
      ? normalise(toPlacement(dragAnchor, dragCurrent))
      : placement
        ? normalise(placement)
        : undefined

  const displayedRows = Math.max(
    MIN_DISPLAYED_ROWS,
    (selection?.rowEnd ?? 0) + 1,
  )

  const isCellSelected = (row: number, col: number): boolean =>
    selection !== undefined &&
    row >= selection.rowStart &&
    row <= selection.rowEnd &&
    col >= selection.colStart &&
    col <= selection.colEnd

  return (
    <Box>
      <FormControl isDisabled={!enabled}>
        <HStack alignItems="start" justifyContent="space-between" w="full">
          <FormLabel description={description}>{label}</FormLabel>
          {placement !== undefined && (
            <Button
              variant="link"
              size="xs"
              isDisabled={!enabled}
              onClick={() => handleChange(path, undefined)}
            >
              Clear placement
            </Button>
          )}
        </HStack>

        <Grid
          templateColumns={`repeat(${CANVAS_GRID_COLUMNS}, 1fr)`}
          gap="0.125rem"
          role="group"
          aria-label={label}
        >
          {Array.from({ length: displayedRows }, (_, rowIndex) =>
            Array.from({ length: CANVAS_GRID_COLUMNS }, (_, colIndex) => {
              const row = rowIndex + 1
              const col = colIndex + 1
              const isSelected = isCellSelected(row, col)
              return (
                <Box
                  key={`${row}-${col}`}
                  as="button"
                  type="button"
                  aria-label={`Row ${row}, column ${col}`}
                  aria-pressed={isSelected}
                  disabled={!enabled}
                  h="1.25rem"
                  borderRadius="2px"
                  bg={
                    isSelected ? "interaction.main.default" : "base.canvas.alt"
                  }
                  _hover={
                    isSelected ? {} : { bg: "interaction.muted.main.hover" }
                  }
                  onMouseDown={(event: React.MouseEvent) => {
                    // Native drag/text selection would swallow the mousemove
                    event.preventDefault()
                    setDragAnchor({ row, col })
                    setDragCurrent({ row, col })
                  }}
                  onMouseEnter={() => {
                    if (dragAnchor) {
                      setDragCurrent({ row, col })
                    }
                  }}
                />
              )
            }),
          )}
        </Grid>

        <Text mt="0.5rem" textStyle="body-2" textColor="base.content.medium">
          {selection
            ? `Columns ${selection.colStart}–${selection.colEnd}, rows ${selection.rowStart}–${selection.rowEnd}`
            : "Not placed: this block stacks across the full canvas width. Drag on the grid to place and size it."}
        </Text>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCanvasPlacementControl)
