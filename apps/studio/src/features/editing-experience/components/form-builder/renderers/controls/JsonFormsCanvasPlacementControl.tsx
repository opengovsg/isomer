import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { CanvasBlockPlacementProps } from "@opengovsg/isomer-components"
import { Box, FormControl, Grid, HStack, Text } from "@chakra-ui/react"
import {
  and,
  isObjectControl,
  rankWith,
  Resolve,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
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

interface NormalisedPlacement {
  colStart: number
  colEnd: number
  rowStart: number
  rowEnd: number
}

// Drawing (and corner-resizing, which is drawing anchored at the opposite
// corner) sweeps a rectangle between two cells; moving shifts the whole
// saved rectangle by the drag delta
type DragState =
  | { mode: "draw"; anchor: GridCell; current: GridCell }
  | {
      mode: "move"
      origin: NormalisedPlacement
      grab: GridCell
      current: GridCell
    }

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

const sweepSelection = (
  anchor: GridCell,
  current: GridCell,
): NormalisedPlacement => ({
  colStart: Math.min(anchor.col, current.col),
  colEnd: Math.max(anchor.col, current.col),
  rowStart: Math.min(anchor.row, current.row),
  rowEnd: Math.max(anchor.row, current.row),
})

const shiftSelection = (
  origin: NormalisedPlacement,
  grab: GridCell,
  current: GridCell,
): NormalisedPlacement => {
  const width = origin.colEnd - origin.colStart
  const height = origin.rowEnd - origin.rowStart
  const colStart = clamp(
    origin.colStart + current.col - grab.col,
    1,
    CANVAS_GRID_COLUMNS - width,
  )
  const rowStart = Math.max(1, origin.rowStart + current.row - grab.row)
  return {
    colStart,
    colEnd: colStart + width,
    rowStart,
    rowEnd: rowStart + height,
  }
}

const resolveDragSelection = (drag: DragState): NormalisedPlacement =>
  drag.mode === "draw"
    ? sweepSelection(drag.anchor, drag.current)
    : shiftSelection(drag.origin, drag.grab, drag.current)

const toPlacement = (
  selection: NormalisedPlacement,
): CanvasBlockPlacementProps => ({
  colStart: selection.colStart,
  colSpan: selection.colEnd - selection.colStart + 1,
  rowStart: selection.rowStart,
  rowSpan: selection.rowEnd - selection.rowStart + 1,
})

// A partial placement (possible in hand-authored content) renders with the
// same defaults the canvas renderer applies: start at the first cell, span
// the full width and a single row
const normalise = (
  placement: CanvasBlockPlacementProps,
): NormalisedPlacement => {
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

// The control is bound to one block's placement (path "blocks.<i>.placement"),
// but placing a block only makes sense relative to its siblings — read the
// other blocks' placements from the shared JsonForms root data
const useSiblingPlacements = (path: string): NormalisedPlacement[] => {
  const context = useJsonForms()
  const segments = path.split(".")
  const blockIndex = Number(segments.at(-2))
  if (!Number.isInteger(blockIndex)) {
    return []
  }
  const blocks: unknown = Resolve.data(
    context.core?.data,
    segments.slice(0, -2).join("."),
  )
  if (!Array.isArray(blocks)) {
    return []
  }
  return blocks
    .filter((_, index) => index !== blockIndex)
    .map(
      (block) => (block as { placement?: CanvasBlockPlacementProps }).placement,
    )
    .filter((placement) => placement !== undefined)
    .map(normalise)
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
  const siblingPlacements = useSiblingPlacements(path)
  const [drag, setDrag] = useState<DragState | null>(null)

  // Committing on window mouseup lets a drag end anywhere (even outside the
  // grid) and still apply the last cell the pointer covered
  useEffect(() => {
    if (!drag) {
      return
    }
    const commitDrag = () => {
      handleChange(path, toPlacement(resolveDragSelection(drag)))
      setDrag(null)
    }
    window.addEventListener("mouseup", commitDrag)
    return () => window.removeEventListener("mouseup", commitDrag)
  }, [drag, handleChange, path])

  if (!visible) {
    return null
  }

  const savedSelection = placement ? normalise(placement) : undefined
  const selection = drag ? resolveDragSelection(drag) : savedSelection

  const displayedRows = Math.max(
    MIN_DISPLAYED_ROWS,
    (selection?.rowEnd ?? 0) + 1,
    ...siblingPlacements.map((sibling) => sibling.rowEnd),
  )

  const coversCell = (
    area: NormalisedPlacement,
    row: number,
    col: number,
  ): boolean =>
    row >= area.rowStart &&
    row <= area.rowEnd &&
    col >= area.colStart &&
    col <= area.colEnd

  const isCellSelected = (row: number, col: number): boolean =>
    selection !== undefined && coversCell(selection, row, col)

  const isCellOccupied = (row: number, col: number): boolean =>
    siblingPlacements.some((sibling) => coversCell(sibling, row, col))

  const isCorner = (
    area: NormalisedPlacement,
    row: number,
    col: number,
  ): boolean =>
    (row === area.rowStart || row === area.rowEnd) &&
    (col === area.colStart || col === area.colEnd)

  // Corners of the saved selection read as resize handles, its body as a
  // move handle, and everything else as a fresh draw
  const cursorFor = (row: number, col: number): string => {
    if (!savedSelection || !coversCell(savedSelection, row, col)) {
      return "crosshair"
    }
    if (isCorner(savedSelection, row, col)) {
      return (row === savedSelection.rowStart) ===
        (col === savedSelection.colStart)
        ? "nwse-resize"
        : "nesw-resize"
    }
    return "move"
  }

  const startDrag = (row: number, col: number): void => {
    if (savedSelection && coversCell(savedSelection, row, col)) {
      if (isCorner(savedSelection, row, col)) {
        // Resize: sweep anchored at the opposite corner of the selection
        setDrag({
          mode: "draw",
          anchor: {
            row:
              row === savedSelection.rowStart
                ? savedSelection.rowEnd
                : savedSelection.rowStart,
            col:
              col === savedSelection.colStart
                ? savedSelection.colEnd
                : savedSelection.colStart,
          },
          current: { row, col },
        })
        return
      }
      setDrag({
        mode: "move",
        origin: savedSelection,
        grab: { row, col },
        current: { row, col },
      })
      return
    }
    setDrag({ mode: "draw", anchor: { row, col }, current: { row, col } })
  }

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
              const isOccupied = isCellOccupied(row, col)
              return (
                <Box
                  key={`${row}-${col}`}
                  as="button"
                  type="button"
                  aria-label={
                    isOccupied
                      ? `Row ${row}, column ${col} (occupied by another block)`
                      : `Row ${row}, column ${col}`
                  }
                  aria-pressed={isSelected}
                  disabled={!enabled}
                  h="1.25rem"
                  borderRadius="2px"
                  bg={
                    isSelected
                      ? "interaction.main.default"
                      : isOccupied
                        ? "interaction.support.disabled"
                        : "base.canvas.alt"
                  }
                  _hover={
                    isSelected ? {} : { bg: "interaction.muted.main.hover" }
                  }
                  cursor={cursorFor(row, col)}
                  onMouseDown={(event: React.MouseEvent) => {
                    // Native drag/text selection would swallow the mousemove
                    event.preventDefault()
                    startDrag(row, col)
                  }}
                  onMouseEnter={() => {
                    setDrag(
                      (currentDrag) =>
                        currentDrag && {
                          ...currentDrag,
                          current: { row, col },
                        },
                    )
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
        {selection && (
          <Text textStyle="body-2" textColor="base.content.medium">
            Drag the highlighted area to move it, or drag a corner to resize it.
          </Text>
        )}
        {siblingPlacements.length > 0 && (
          <Text textStyle="body-2" textColor="base.content.medium">
            Shaded cells are occupied by other blocks in this canvas.
          </Text>
        )}
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCanvasPlacementControl)
