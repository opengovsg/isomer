import type { ControlProps, RankedTester } from "@jsonforms/core"
import type { CanvasBlockPlacementProps } from "@opengovsg/isomer-components"
import {
  Box,
  FormControl,
  Grid,
  HStack,
  Text,
  useToken,
} from "@chakra-ui/react"
import {
  and,
  isObjectControl,
  rankWith,
  Resolve,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { Button, FormLabel, Infobox } from "@opengovsg/design-system-react"
import {
  CANVAS_CONTAINER_DATA_ATTRIBUTE,
  CANVAS_GRID_COLUMNS,
} from "@opengovsg/isomer-components"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useOptionalEditorDrawerContext } from "~/contexts/EditorDrawerContext"

import type { CanvasSelectionEdge } from "../../../../utils/canvasPreviewBlock"
import {
  CANVAS_MAX_ROW,
  CANVAS_SELECTION_EDGE_HANDLES,
  CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE,
  findCanvasBlockPreviewElement,
  isEditableTarget,
  resolveCanvasBlockGridArea,
  resolveCanvasGridCellFromPoint,
  showCanvasDragBadge,
  showCanvasGridOverlay,
  showCanvasSelectionHandles,
} from "../../../../utils/canvasPreviewBlock"
import { takeCanvasPreviewGrabHandoff } from "../../../../utils/canvasPreviewGrabHandoff"

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
// saved rectangle by the drag delta. An edge-handle resize is a draw whose
// `lock` axis never follows the pointer, so the block only grows or shrinks
// in the handle's direction.
type DragState =
  | { mode: "draw"; anchor: GridCell; current: GridCell; lock?: "row" | "col" }
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

const coversCell = (
  area: NormalisedPlacement,
  row: number,
  col: number,
): boolean =>
  row >= area.rowStart &&
  row <= area.rowEnd &&
  col >= area.colStart &&
  col <= area.colEnd

const isCorner = (
  area: NormalisedPlacement,
  row: number,
  col: number,
): boolean =>
  (row === area.rowStart || row === area.rowEnd) &&
  (col === area.colStart || col === area.colEnd)

const rectanglesOverlap = (
  a: NormalisedPlacement,
  b: NormalisedPlacement,
): boolean =>
  a.colStart <= b.colEnd &&
  b.colStart <= a.colEnd &&
  a.rowStart <= b.rowEnd &&
  b.rowStart <= a.rowEnd

const resolveDragSelection = (drag: DragState): NormalisedPlacement =>
  drag.mode === "draw"
    ? sweepSelection(drag.anchor, drag.current)
    : shiftSelection(drag.origin, drag.grab, drag.current)

// Every pointer/focus update to a drag's current cell goes through here so a
// locked axis is pinned in one place
const withCurrent = (drag: DragState, cell: GridCell): DragState =>
  drag.mode === "draw" && drag.lock !== undefined
    ? {
        ...drag,
        current: {
          row: drag.lock === "row" ? drag.current.row : cell.row,
          col: drag.lock === "col" ? drag.current.col : cell.col,
        },
      }
    : { ...drag, current: cell }

// Grabbing a mid-edge handle resizes along that edge's axis only: the sweep
// is anchored on the opposite edge and the perpendicular axis is locked to
// the block's current extent
const edgeResizeDrag = (
  base: NormalisedPlacement,
  edge: CanvasSelectionEdge,
): DragState => ({
  mode: "draw",
  anchor: {
    row: edge === "top" ? base.rowEnd : base.rowStart,
    col: edge === "left" ? base.colEnd : base.colStart,
  },
  current: {
    row: edge === "top" ? base.rowStart : base.rowEnd,
    col: edge === "left" ? base.colStart : base.colEnd,
  },
  lock: edge === "left" || edge === "right" ? "row" : "col",
})

// The selection handles are DOM children of the preview block, so a handle
// grab arrives at the block's mousedown listener; the handle's name says
// whether an edge (axis-locked) resize was grabbed. The target lives in the
// preview iframe's realm, so duck-type instead of instanceof Element.
const resolveGrabbedEdge = (
  target: EventTarget | null,
): CanvasSelectionEdge | null => {
  const element = target as Partial<Element> | null
  if (typeof element?.closest !== "function") {
    return null
  }
  const name = element
    .closest(`[${CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE}]`)
    ?.getAttribute(CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE)
  const edge = CANVAS_SELECTION_EDGE_HANDLES.find((value) => value === name)
  return edge ?? null
}

const ARROW_KEY_DELTAS: Record<string, GridCell> = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
}

const toPlacement = (
  selection: NormalisedPlacement,
): CanvasBlockPlacementProps => ({
  colStart: selection.colStart,
  colSpan: selection.colEnd - selection.colStart + 1,
  rowStart: selection.rowStart,
  rowSpan: selection.rowEnd - selection.rowStart + 1,
})

const placementsEqual = (
  a: CanvasBlockPlacementProps | undefined,
  b: CanvasBlockPlacementProps,
): boolean =>
  a !== undefined &&
  a.colStart === b.colStart &&
  a.colSpan === b.colSpan &&
  a.rowStart === b.rowStart &&
  a.rowSpan === b.rowSpan

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

// Resolves the edited block's rendered element in the live preview. The
// canvas being edited is the page block at currActiveIdx; its rendered
// container is found by counting the canvases before it. Outside the editor
// drawer (or before the preview has rendered) this resolves to null.
const usePreviewBlockLocator = (path: string): (() => HTMLElement | null) => {
  const editorContext = useOptionalEditorDrawerContext()
  const blockIndex = Number(path.split(".").at(-2))
  const content = editorContext?.previewPageState.content
  const currActiveIdx = editorContext?.currActiveIdx

  const canvasOrdinal = useMemo(() => {
    if (
      content === undefined ||
      currActiveIdx === undefined ||
      content[currActiveIdx]?.type !== "canvas"
    ) {
      return null
    }
    return content
      .slice(0, currActiveIdx)
      .filter((block) => block.type === "canvas").length
  }, [content, currActiveIdx])

  return useCallback(() => {
    if (canvasOrdinal === null || !Number.isInteger(blockIndex)) {
      return null
    }
    return findCanvasBlockPreviewElement(document, canvasOrdinal, blockIndex)
  }, [blockIndex, canvasOrdinal])
}

// While a block's placement editor is open, outline that block in the live
// preview and scroll it into view, so it is clear which block on the page is
// being placed.
const useHighlightPreviewBlock = (
  locatePreviewBlock: () => HTMLElement | null,
): void => {
  const [highlightColor] = useToken("colors", ["interaction.main.default"])

  useEffect(() => {
    const element = locatePreviewBlock()
    if (!element) {
      return
    }
    const previousOutline = element.style.outline
    const previousOutlineOffset = element.style.outlineOffset
    element.style.outline = `2px solid ${highlightColor}`
    element.style.outlineOffset = "2px"
    element.scrollIntoView({ block: "nearest" })
    return () => {
      element.style.outline = previousOutline
      element.style.outlineOffset = previousOutlineOffset
    }
  }, [highlightColor, locatePreviewBlock])
}

// Wix-style resize affordance: while the block can be grabbed in the live
// preview, its corners show visible resize handles. Grabbing a handle bubbles
// to the block's own grab listener, which resolves the corner cell into the
// existing corner-resize drag — the handles only make the interaction visible.
const usePreviewSelectionHandles = (
  locatePreviewBlock: () => HTMLElement | null,
  active: boolean,
): void => {
  const [handleColor] = useToken("colors", ["interaction.main.default"])

  useEffect(() => {
    if (!active) {
      return
    }
    const element = locatePreviewBlock()
    if (!element) {
      return
    }
    return showCanvasSelectionHandles(element, handleColor)
  }, [active, handleColor, locatePreviewBlock])
}

// The rendered page gives no hint of where the grid cells are, so while a
// placement drag is in progress (whether it started on the picker or on the
// preview block itself) the grid's column and row guides are drawn on the
// preview canvas, Wix-style, and removed when the drag ends
const usePreviewGridGuides = (
  locatePreviewBlock: () => HTMLElement | null,
  dragActive: boolean,
): void => {
  const [guideColor] = useToken("colors", ["interaction.main.default"])

  useEffect(() => {
    if (!dragActive) {
      return
    }
    const previewCanvas = locatePreviewBlock()?.closest<HTMLElement>(
      `[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`,
    )
    if (!previewCanvas) {
      return
    }
    return showCanvasGridOverlay(previewCanvas, guideColor)
  }, [dragActive, guideColor, locatePreviewBlock])
}

// A user dragging on the preview is looking at the block, not at the picker's
// summary line in the drawer — so while a drag is in progress the live grid
// area is also pinned above the block as a small badge, Wix-style
const usePreviewDragBadge = (
  locatePreviewBlock: () => HTMLElement | null,
  selection: NormalisedPlacement | null,
): void => {
  const [badgeColor] = useToken("colors", ["interaction.main.default"])
  const text =
    selection === null
      ? null
      : `Columns ${selection.colStart}–${selection.colEnd}, rows ${selection.rowStart}–${selection.rowEnd}`

  useEffect(() => {
    if (text === null) {
      return
    }
    const element = locatePreviewBlock()
    if (!element) {
      return
    }
    return showCanvasDragBadge(element, text, badgeColor)
  }, [text, badgeColor, locatePreviewBlock])
}

const restoreCustomProperty = (
  element: HTMLElement,
  name: string,
  value: string,
): void => {
  if (value) {
    element.style.setProperty(name, value)
  } else {
    element.style.removeProperty(name)
  }
}

// The preview only re-renders when a placement is committed, so during a drag
// the edited block is repositioned live by writing the same CSS custom
// properties the Canvas renderer emits. The returned release function ends the
// feedback: a committed drag keeps the final values (the committed data
// re-renders the preview and owns them from then on), a cancelled drag
// restores what was there before. Closing the editor mid-drag also restores.
const usePreviewDragFeedback = (
  locatePreviewBlock: () => HTMLElement | null,
  selection: NormalisedPlacement | null,
): ((options: { restore: boolean }) => void) => {
  const capturedRef = useRef<{
    element: HTMLElement
    column: string
    row: string
  } | null>(null)

  const column =
    selection === null
      ? null
      : `${selection.colStart} / span ${selection.colEnd - selection.colStart + 1}`
  const row =
    selection === null
      ? null
      : `${selection.rowStart} / span ${selection.rowEnd - selection.rowStart + 1}`

  useEffect(() => {
    if (column === null || row === null) {
      return
    }
    const element = capturedRef.current?.element ?? locatePreviewBlock()
    if (!element) {
      return
    }
    capturedRef.current ??= {
      element,
      column: element.style.getPropertyValue("--canvas-grid-column"),
      row: element.style.getPropertyValue("--canvas-grid-row"),
    }
    element.style.setProperty("--canvas-grid-column", column)
    element.style.setProperty("--canvas-grid-row", row)
  }, [column, locatePreviewBlock, row])

  const release = useCallback((options: { restore: boolean }) => {
    const captured = capturedRef.current
    capturedRef.current = null
    if (!captured || !options.restore) {
      return
    }
    restoreCustomProperty(
      captured.element,
      "--canvas-grid-column",
      captured.column,
    )
    restoreCustomProperty(captured.element, "--canvas-grid-row", captured.row)
  }, [])

  useEffect(() => () => release({ restore: true }), [release])

  return release
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
  // A mousedown on the preview block is only a grab candidate: the drag (and
  // its commit-on-mouseup) starts once the pointer reaches a different grid
  // cell, so a plain click cannot commit a placement — which would silently
  // pin an unplaced block to its current footprint
  const [pendingGrab, setPendingGrab] = useState<{
    base: NormalisedPlacement
    grab: GridCell
    edge: CanvasSelectionEdge | null
  } | null>(null)
  const locatePreviewBlock = usePreviewBlockLocator(path)
  useHighlightPreviewBlock(locatePreviewBlock)
  usePreviewSelectionHandles(locatePreviewBlock, visible && enabled)

  const savedSelection = useMemo(
    () => (placement ? normalise(placement) : undefined),
    [placement],
  )

  const dragSelection = drag ? resolveDragSelection(drag) : null
  const releasePreviewDragFeedback = usePreviewDragFeedback(
    locatePreviewBlock,
    dragSelection,
  )
  usePreviewGridGuides(locatePreviewBlock, drag !== null)
  usePreviewDragBadge(locatePreviewBlock, dragSelection)

  // Starts a drag relative to a base rectangle: its corners resize (a sweep
  // anchored at the opposite corner), its body moves, and anywhere else
  // draws a fresh rectangle. The base is the saved placement for picker
  // cells, or an unplaced block's rendered footprint for preview grabs.
  const startDragWithin = useCallback(
    (base: NormalisedPlacement | undefined, row: number, col: number): void => {
      if (base && coversCell(base, row, col)) {
        if (isCorner(base, row, col)) {
          setDrag({
            mode: "draw",
            anchor: {
              row: row === base.rowStart ? base.rowEnd : base.rowStart,
              col: col === base.colStart ? base.colEnd : base.colStart,
            },
            current: { row, col },
          })
          return
        }
        setDrag({
          mode: "move",
          origin: base,
          grab: { row, col },
          current: { row, col },
        })
        return
      }
      setDrag({ mode: "draw", anchor: { row, col }, current: { row, col } })
    },
    [],
  )

  const startDrag = useCallback(
    (row: number, col: number): void =>
      startDragWithin(savedSelection, row, col),
    [savedSelection, startDragWithin],
  )

  const cancelDrag = useCallback(() => {
    releasePreviewDragFeedback({ restore: true })
    setDrag(null)
  }, [releasePreviewDragFeedback])

  // A selection identical to the saved placement (a click on the selection's
  // body or corner, or a drag released back at its origin) would only dirty
  // the page, so it ends the drag without committing anything
  const commitSelection = useCallback(
    (selection: NormalisedPlacement): void => {
      const next = toPlacement(selection)
      if (placementsEqual(placement, next)) {
        cancelDrag()
        return
      }
      releasePreviewDragFeedback({ restore: false })
      handleChange(path, next)
      setDrag(null)
    },
    [placement, cancelDrag, releasePreviewDragFeedback, handleChange, path],
  )

  // Committing on window mouseup lets a drag end anywhere (even outside the
  // grid) and still apply the last cell the pointer covered. A drag started
  // on (or wandering over) the preview iframe delivers its mouse events to
  // the iframe's own window, so the pointer is tracked there too, mapped back
  // to grid cells through the rendered canvas's geometry.
  useEffect(() => {
    if (!drag) {
      return
    }
    const commitDrag = () => {
      commitSelection(resolveDragSelection(drag))
    }
    // While a drag is active, Escape means "cancel the drag" wherever it is
    // pressed — capture phase on both windows so it works for drags started
    // on the preview block (focus sits in the iframe) and never reaches the
    // drawer/modal close handlers
    const cancelOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      cancelDrag()
    }
    window.addEventListener("mouseup", commitDrag)
    window.addEventListener("keydown", cancelOnEscape, true)

    const previewBlock = locatePreviewBlock()
    const previewCanvas =
      previewBlock?.closest<HTMLElement>(
        `[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`,
      ) ?? null
    const previewWindow = previewBlock?.ownerDocument.defaultView ?? null
    const trackPreviewPointer = (event: MouseEvent) => {
      if (!previewCanvas) {
        return
      }
      const cell = resolveCanvasGridCellFromPoint(
        previewCanvas,
        event.clientX,
        event.clientY,
      )
      if (!cell) {
        return
      }
      setDrag((currentDrag) => currentDrag && withCurrent(currentDrag, cell))
    }
    previewWindow?.addEventListener("mousemove", trackPreviewPointer)
    previewWindow?.addEventListener("mouseup", commitDrag)
    previewWindow?.addEventListener("keydown", cancelOnEscape, true)
    return () => {
      window.removeEventListener("mouseup", commitDrag)
      window.removeEventListener("keydown", cancelOnEscape, true)
      previewWindow?.removeEventListener("mousemove", trackPreviewPointer)
      previewWindow?.removeEventListener("mouseup", commitDrag)
      previewWindow?.removeEventListener("keydown", cancelOnEscape, true)
    }
  }, [drag, commitSelection, cancelDrag, locatePreviewBlock])

  // Wix-like direct manipulation: the block can be grabbed in the live
  // preview itself — its body moves it, a corner cell resizes it (the same
  // semantics as the picker grid). An unplaced block has no saved placement
  // to manipulate, so its rendered footprint (full width in flow order)
  // stands in as the grabbed rectangle: dragging it commits the block's
  // first placement.
  useEffect(() => {
    if (!visible || !enabled) {
      return
    }
    const previewBlock = locatePreviewBlock()
    const previewCanvas = previewBlock?.closest<HTMLElement>(
      `[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`,
    )
    if (!previewBlock || !previewCanvas) {
      return
    }
    const grabBlock = (event: MouseEvent) => {
      if (event.button !== 0) {
        return
      }
      const cell = resolveCanvasGridCellFromPoint(
        previewCanvas,
        event.clientX,
        event.clientY,
      )
      const base =
        savedSelection ??
        resolveCanvasBlockGridArea(previewCanvas, previewBlock) ??
        undefined
      if (!cell || !base) {
        return
      }
      // Keep the preview content from starting native drags or text selection
      event.preventDefault()
      event.stopPropagation()
      // Geometry rounding at the block's edges could land just outside the
      // grabbed area; clamping guarantees a grab is a move or a corner
      // resize, never a fresh draw that would shrink the block to a single
      // cell
      setPendingGrab({
        base,
        grab: {
          row: clamp(cell.row, base.rowStart, base.rowEnd),
          col: clamp(cell.col, base.colStart, base.colEnd),
        },
        edge: resolveGrabbedEdge(event.target),
      })
    }
    const previousCursor = previewBlock.style.cursor
    previewBlock.style.cursor = "move"
    previewBlock.addEventListener("mousedown", grabBlock)
    return () => {
      previewBlock.removeEventListener("mousedown", grabBlock)
      previewBlock.style.cursor = previousCursor
    }
  }, [visible, enabled, savedSelection, locatePreviewBlock])

  // The press that selected this block in the live preview (see
  // useCanvasPreviewClickToEdit) happened before this control mounted, so it
  // is handed over rather than observed: resume it as a grab, and the same
  // gesture that selected the block can keep going as a drag, Wix-style. The
  // handoff is already invalidated if the press was released.
  useEffect(() => {
    if (!visible || !enabled) {
      return
    }
    const blockIndex = Number(path.split(".").at(-2))
    if (!Number.isInteger(blockIndex)) {
      return
    }
    const grabHandoff = takeCanvasPreviewGrabHandoff(blockIndex)
    if (!grabHandoff) {
      return
    }
    const previewBlock = locatePreviewBlock()
    const previewCanvas = previewBlock?.closest<HTMLElement>(
      `[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`,
    )
    if (!previewBlock || !previewCanvas) {
      return
    }
    const cell = resolveCanvasGridCellFromPoint(
      previewCanvas,
      grabHandoff.clientX,
      grabHandoff.clientY,
    )
    const base =
      savedSelection ??
      resolveCanvasBlockGridArea(previewCanvas, previewBlock) ??
      undefined
    if (!cell || !base) {
      return
    }
    setPendingGrab({
      base,
      grab: {
        row: clamp(cell.row, base.rowStart, base.rowEnd),
        col: clamp(cell.col, base.colStart, base.colEnd),
      },
      // The selection handles did not exist when the press landed, so a
      // handed-over grab is always a body move or corner resize
      edge: null,
    })
  }, [visible, enabled, path, savedSelection, locatePreviewBlock])

  // A pending grab turns into a real drag on the first pointer movement that
  // reaches a different grid cell; releasing the mouse first abandons it
  // without committing anything
  useEffect(() => {
    if (!pendingGrab) {
      return
    }
    const previewBlock = locatePreviewBlock()
    const previewCanvas = previewBlock?.closest<HTMLElement>(
      `[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`,
    )
    const previewWindow = previewBlock?.ownerDocument.defaultView ?? null
    const beginDragOnMove = (event: MouseEvent) => {
      if (!previewCanvas) {
        return
      }
      const cell = resolveCanvasGridCellFromPoint(
        previewCanvas,
        event.clientX,
        event.clientY,
      )
      if (
        !cell ||
        (cell.row === pendingGrab.grab.row && cell.col === pendingGrab.grab.col)
      ) {
        return
      }
      setPendingGrab(null)
      if (pendingGrab.edge) {
        setDrag(
          withCurrent(edgeResizeDrag(pendingGrab.base, pendingGrab.edge), cell),
        )
        return
      }
      startDragWithin(
        pendingGrab.base,
        pendingGrab.grab.row,
        pendingGrab.grab.col,
      )
      // Batched after startDragWithin's update, so the drag begins already
      // extended to the cell that crossed the threshold
      setDrag((currentDrag) => currentDrag && withCurrent(currentDrag, cell))
    }
    const abandonGrab = () => setPendingGrab(null)
    previewWindow?.addEventListener("mousemove", beginDragOnMove)
    previewWindow?.addEventListener("mouseup", abandonGrab)
    window.addEventListener("mouseup", abandonGrab)
    return () => {
      previewWindow?.removeEventListener("mousemove", beginDragOnMove)
      previewWindow?.removeEventListener("mouseup", abandonGrab)
      window.removeEventListener("mouseup", abandonGrab)
    }
  }, [pendingGrab, locatePreviewBlock, startDragWithin])

  // Wix-style keyboard nudging: while a placed block's editor is open and no
  // drag is in progress, an arrow key moves the block one grid cell in that
  // direction, clamped to the grid; holding Shift resizes instead, growing or
  // shrinking the block's end edge one cell. Registered on both windows so it
  // works whether focus sits in the drawer or in the preview iframe;
  // keystrokes aimed at a form field keep their editing meaning.
  useEffect(() => {
    if (!visible || !enabled || drag || pendingGrab || !savedSelection) {
      return
    }
    const nudge = (event: KeyboardEvent) => {
      const delta = ARROW_KEY_DELTAS[event.key]
      if (
        !delta ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableTarget(event.target)
      ) {
        return
      }
      event.preventDefault()
      if (event.shiftKey) {
        commitSelection({
          ...savedSelection,
          colEnd: clamp(
            savedSelection.colEnd + delta.col,
            savedSelection.colStart,
            CANVAS_GRID_COLUMNS,
          ),
          rowEnd: clamp(
            savedSelection.rowEnd + delta.row,
            savedSelection.rowStart,
            CANVAS_MAX_ROW,
          ),
        })
        return
      }
      const width = savedSelection.colEnd - savedSelection.colStart
      const height = savedSelection.rowEnd - savedSelection.rowStart
      const colStart = clamp(
        savedSelection.colStart + delta.col,
        1,
        CANVAS_GRID_COLUMNS - width,
      )
      const rowStart = clamp(
        savedSelection.rowStart + delta.row,
        1,
        Math.max(1, CANVAS_MAX_ROW - height),
      )
      commitSelection({
        colStart,
        colEnd: colStart + width,
        rowStart,
        rowEnd: rowStart + height,
      })
    }
    window.addEventListener("keydown", nudge)
    const previewWindow =
      locatePreviewBlock()?.ownerDocument.defaultView ?? null
    const foreignPreviewWindow = previewWindow === window ? null : previewWindow
    foreignPreviewWindow?.addEventListener("keydown", nudge)
    return () => {
      window.removeEventListener("keydown", nudge)
      foreignPreviewWindow?.removeEventListener("keydown", nudge)
    }
  }, [
    visible,
    enabled,
    drag,
    pendingGrab,
    savedSelection,
    commitSelection,
    locatePreviewBlock,
  ])

  if (!visible) {
    return null
  }

  const selection = dragSelection ?? savedSelection

  const displayedRows = Math.max(
    MIN_DISPLAYED_ROWS,
    (selection?.rowEnd ?? 0) + 1,
    ...siblingPlacements.map((sibling) => sibling.rowEnd),
  )

  const isCellSelected = (row: number, col: number): boolean =>
    selection !== undefined && coversCell(selection, row, col)

  const isCellOccupied = (row: number, col: number): boolean =>
    siblingPlacements.some((sibling) => coversCell(sibling, row, col))

  // Overlap is legal (CSS grid stacks the blocks), so warn rather than block
  const overlapsSibling =
    selection !== undefined &&
    siblingPlacements.some((sibling) => rectanglesOverlap(selection, sibling))

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
                        currentDrag && withCurrent(currentDrag, { row, col }),
                    )
                  }}
                  // Tabbing between cells extends an in-progress keyboard
                  // selection the same way sweeping the pointer does
                  onFocus={() => {
                    setDrag(
                      (currentDrag) =>
                        currentDrag && withCurrent(currentDrag, { row, col }),
                    )
                  }}
                  onKeyDown={(event: React.KeyboardEvent) => {
                    if (event.key === "Enter" || event.key === " ") {
                      // Stop the button's synthetic click so one activation
                      // is not treated as both start and commit
                      event.preventDefault()
                      if (drag) {
                        commitSelection(
                          resolveDragSelection(withCurrent(drag, { row, col })),
                        )
                      } else {
                        startDrag(row, col)
                      }
                    }
                    // Escape is handled by the window-level capture listener
                    // that is registered while a drag is active
                  }}
                />
              )
            }),
          )}
        </Grid>

        <Text mt="0.5rem" textStyle="body-2" textColor="base.content.medium">
          {selection
            ? `Columns ${selection.colStart}–${selection.colEnd}, rows ${selection.rowStart}–${selection.rowEnd}`
            : "Not placed: this block stacks across the full canvas width. Drag on the grid (or drag the block itself in the page preview) to place and size it, or press Enter on a starting cell and again on an ending cell. Press Delete to remove the block from the canvas, or ⌘D/Ctrl+D to duplicate it."}
        </Text>
        {selection && (
          <Text textStyle="body-2" textColor="base.content.medium">
            Drag the highlighted area (or the block itself in the page preview)
            to move it, or drag a corner to resize it — in the preview, the edge
            handles resize in one direction only. With the keyboard, use the
            arrow keys to nudge the block one cell at a time (hold Shift to
            resize instead), or press Enter on a cell to start a selection,
            Enter on another cell to finish, and Escape to cancel. Press Delete
            to remove the block from the canvas, or ⌘D/Ctrl+D to duplicate it.
          </Text>
        )}
        {siblingPlacements.length > 0 && (
          <Text textStyle="body-2" textColor="base.content.medium">
            Shaded cells are occupied by other blocks in this canvas.
          </Text>
        )}
        {overlapsSibling && (
          <Infobox variant="warning" size="sm" mt="0.5rem">
            This placement overlaps another block. Overlapping blocks are
            stacked on top of each other on the page.
          </Infobox>
        )}
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsCanvasPlacementControl)
