import {
  CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE,
  CANVAS_CONTAINER_DATA_ATTRIBUTE,
  CANVAS_GRID_COLUMNS,
} from "@opengovsg/isomer-components"

// The live preview renders the page inside a react-frame-component iframe;
// the editor drawer cannot reach it via refs, so locate it by looking for
// the iframe whose document contains a rendered canvas
export const findPreviewDocumentWithCanvas = (doc: Document): Document | null =>
  Array.from(doc.querySelectorAll("iframe"))
    .map((iframe) => iframe.contentDocument)
    .find(
      (innerDoc) =>
        innerDoc?.querySelector(`[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`) != null,
    ) ?? null

// Canvases render in content order, so the nth canvas block on the page is
// the nth canvas container in the preview document
export const findCanvasPreviewContainer = (
  doc: Document,
  canvasOrdinal: number,
): HTMLElement | null =>
  findPreviewDocumentWithCanvas(doc)
    ?.querySelectorAll<HTMLElement>(`[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`)
    .item(canvasOrdinal) ?? null

export const findCanvasBlockPreviewElement = (
  doc: Document,
  canvasOrdinal: number,
  blockIndex: number,
): HTMLElement | null =>
  findCanvasPreviewContainer(doc, canvasOrdinal)?.querySelector<HTMLElement>(
    `[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}="${blockIndex}"]`,
  ) ?? null

// Keystrokes aimed at a form field keep their editing meaning; the target may
// live in the preview iframe's realm, so duck-type instead of instanceof
export const isEditableTarget = (target: EventTarget | null): boolean => {
  const element = target as Partial<Element> | null
  return (
    typeof element?.closest === "function" &&
    element.closest('input, textarea, select, [contenteditable="true"]') !==
      null
  )
}

export interface CanvasGridCell {
  row: number
  col: number
}

// Matches the Canvas renderer's auto-rows-[minmax(2rem,auto)] base row height
const CANVAS_BASE_ROW_HEIGHT_PX = 32
// The placement schema bounds row values at 100
export const CANVAS_MAX_ROW = 100

const parsePx = (value: string): number => {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

// Used row track sizes as the browser reports them; content can stretch
// implicit tracks past the base row height
const readRowTracks = (style: CSSStyleDeclaration): number[] =>
  style.gridTemplateRows === "none"
    ? []
    : style.gridTemplateRows
        .split(" ")
        .map(parsePx)
        .filter((track) => track > 0)

// Maps a pointer position (client coordinates within the preview document) to
// the grid cell of a rendered canvas container, so blocks can be dragged
// directly on the live preview. Columns divide the content box evenly; row
// heights come from the grid's used track sizes when the browser reports them
// (content can stretch rows past the base height), and positions past the
// last track fall back to the base row height.
export const resolveCanvasGridCellFromPoint = (
  canvas: HTMLElement,
  clientX: number,
  clientY: number,
): CanvasGridCell | null => {
  const view = canvas.ownerDocument.defaultView
  if (!view) {
    return null
  }
  const style = view.getComputedStyle(canvas)
  const rect = canvas.getBoundingClientRect()

  const columnGap = parsePx(style.columnGap)
  const contentLeft =
    rect.left + parsePx(style.borderLeftWidth) + parsePx(style.paddingLeft)
  const contentWidth =
    rect.width -
    parsePx(style.borderLeftWidth) -
    parsePx(style.borderRightWidth) -
    parsePx(style.paddingLeft) -
    parsePx(style.paddingRight)
  const columnWidth =
    (contentWidth - columnGap * (CANVAS_GRID_COLUMNS - 1)) / CANVAS_GRID_COLUMNS
  if (columnWidth <= 0) {
    return null
  }
  const col = clamp(
    Math.floor((clientX - contentLeft) / (columnWidth + columnGap)) + 1,
    1,
    CANVAS_GRID_COLUMNS,
  )

  // The container scrolls, so the pointer offset is measured from the content
  // box origin, not the visible top
  const contentTop =
    rect.top +
    parsePx(style.borderTopWidth) +
    parsePx(style.paddingTop) -
    canvas.scrollTop
  const rowGap = parsePx(style.rowGap)
  const rowTracks = readRowTracks(style)

  let offset = clientY - contentTop
  let row = 1
  for (const track of rowTracks) {
    // A position inside the track or its trailing gap belongs to this row
    if (offset < track + rowGap) {
      return { row: clamp(row, 1, CANVAS_MAX_ROW), col }
    }
    offset -= track + rowGap
    row += 1
  }
  row += Math.floor(Math.max(0, offset) / (CANVAS_BASE_ROW_HEIGHT_PX + rowGap))
  return { row: clamp(row, 1, CANVAS_MAX_ROW), col }
}

export interface CanvasGridArea {
  colStart: number
  colEnd: number
  rowStart: number
  rowEnd: number
}

// The grid cells a rendered block currently covers. An unplaced block has no
// placement data to manipulate relative to, so its rendered footprint serves
// as the starting rectangle when it is grabbed in the preview to receive its
// first placement.
export const resolveCanvasBlockGridArea = (
  canvas: HTMLElement,
  block: HTMLElement,
): CanvasGridArea | null => {
  const rect = block.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return null
  }
  // Inset by a pixel so an edge sitting exactly on a cell boundary cannot
  // round into the neighbouring cell
  const topLeft = resolveCanvasGridCellFromPoint(
    canvas,
    rect.left + 1,
    rect.top + 1,
  )
  const bottomRight = resolveCanvasGridCellFromPoint(
    canvas,
    rect.right - 1,
    rect.bottom - 1,
  )
  if (!topLeft || !bottomRight) {
    return null
  }
  return {
    colStart: Math.min(topLeft.col, bottomRight.col),
    colEnd: Math.max(topLeft.col, bottomRight.col),
    rowStart: Math.min(topLeft.row, bottomRight.row),
    rowEnd: Math.max(topLeft.row, bottomRight.row),
  }
}

// The canvas's width field is a percentage, resolved against its parent's
// content box — a freely-resized canvas maps back to the schema through the
// parent's width. Returns null when the parent has no measurable width.
export const resolveCanvasWidthPercent = (
  canvas: HTMLElement,
): number | null => {
  const view = canvas.ownerDocument.defaultView
  const parent = canvas.parentElement
  if (!view || !parent) {
    return null
  }
  const style = view.getComputedStyle(parent)
  const contentWidth =
    parent.getBoundingClientRect().width -
    parsePx(style.borderLeftWidth) -
    parsePx(style.borderRightWidth) -
    parsePx(style.paddingLeft) -
    parsePx(style.paddingRight)
  if (contentWidth <= 0) {
    return null
  }
  return (canvas.getBoundingClientRect().width / contentWidth) * 100
}

export const CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE =
  "data-canvas-selection-handle"

// Mid-edge handles resize along one axis only; the placement control reads
// the grabbed handle's name off the data attribute to lock the other axis
export const CANVAS_SELECTION_EDGE_HANDLES = [
  "top",
  "bottom",
  "left",
  "right",
] as const

export type CanvasSelectionEdge = (typeof CANVAS_SELECTION_EDGE_HANDLES)[number]

const SELECTION_HANDLES = [
  { name: "top-left", top: "0%", left: "0%", cursor: "nwse-resize" },
  { name: "top-right", top: "0%", left: "100%", cursor: "nesw-resize" },
  { name: "bottom-left", top: "100%", left: "0%", cursor: "nesw-resize" },
  { name: "bottom-right", top: "100%", left: "100%", cursor: "nwse-resize" },
  { name: "top", top: "0%", left: "50%", cursor: "ns-resize" },
  { name: "bottom", top: "100%", left: "50%", cursor: "ns-resize" },
  { name: "left", top: "50%", left: "0%", cursor: "ew-resize" },
  { name: "right", top: "50%", left: "100%", cursor: "ew-resize" },
] as const

// Wix-style selection handles: while a block's editor is open, its corners
// and edge midpoints show visible resize handles in the live preview. The
// handles are an affordance layer only — their mousedowns bubble to the
// block's grab listener, which resolves corners into the existing
// corner-resize drag and edges into an axis-locked resize. Returns a cleanup
// that removes the handles and restores the block's positioning.
export const showCanvasSelectionHandles = (
  block: HTMLElement,
  handleColor: string,
): (() => void) => {
  const doc = block.ownerDocument
  // The handles sit on the block's corners, so it must be their containing
  // block; the canvas renderer leaves block wrappers statically positioned
  const previousPosition = block.style.position
  block.style.position = "relative"
  const handles = SELECTION_HANDLES.map(({ name, top, left, cursor }) => {
    const handle = doc.createElement("div")
    handle.setAttribute(CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE, name)
    handle.setAttribute("aria-hidden", "true")
    Object.assign(handle.style, {
      position: "absolute",
      top,
      left,
      width: "10px",
      height: "10px",
      transform: "translate(-50%, -50%)",
      boxSizing: "border-box",
      backgroundColor: "#ffffff",
      border: `2px solid ${handleColor}`,
      borderRadius: "50%",
      cursor,
      zIndex: "1",
    })
    block.appendChild(handle)
    return handle
  })
  return () => {
    handles.forEach((handle) => handle.remove())
    block.style.position = previousPosition
  }
}

export const CANVAS_DRAG_BADGE_DATA_ATTRIBUTE = "data-canvas-drag-badge"
export const CANVAS_HOVER_LABEL_DATA_ATTRIBUTE = "data-canvas-hover-label"

// Pins a small text chip above a preview block. Returns a cleanup that
// removes the chip; it only touches the block's positioning when nothing
// else (e.g. the selection handles) has already made the block a containing
// block.
const pinCanvasBlockChip = (
  block: HTMLElement,
  text: string,
  chipColor: string,
  attribute: string,
  placement: { left: string; transform: string },
): (() => void) => {
  const appliedPosition = block.style.position === ""
  if (appliedPosition) {
    block.style.position = "relative"
  }
  const chip = block.ownerDocument.createElement("div")
  chip.setAttribute(attribute, "")
  chip.setAttribute("aria-hidden", "true")
  chip.textContent = text
  Object.assign(chip.style, {
    position: "absolute",
    bottom: "100%",
    left: placement.left,
    transform: placement.transform,
    backgroundColor: chipColor,
    color: "#ffffff",
    fontSize: "12px",
    lineHeight: "1.4",
    padding: "2px 8px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: "2",
  })
  block.appendChild(chip)
  return () => {
    chip.remove()
    if (appliedPosition) {
      block.style.position = ""
    }
  }
}

// Wix-style drag badge: while a placement drag is in progress, a small label
// pinned above the block shows the grid area it will occupy on release, so
// the user dragging on the preview sees the live position without looking
// away at the picker's summary line.
export const showCanvasDragBadge = (
  block: HTMLElement,
  text: string,
  badgeColor: string,
): (() => void) =>
  pinCanvasBlockChip(
    block,
    text,
    badgeColor,
    CANVAS_DRAG_BADGE_DATA_ATTRIBUTE,
    {
      left: "50%",
      transform: "translate(-50%, -6px)",
    },
  )

// Wix-style hover label: hovering a selectable block names it with a chip at
// its top-left corner alongside the dashed hover outline, so blocks can be
// identified before clicking one to edit it.
export const showCanvasHoverLabel = (
  block: HTMLElement,
  text: string,
  labelColor: string,
): (() => void) =>
  pinCanvasBlockChip(
    block,
    text,
    labelColor,
    CANVAS_HOVER_LABEL_DATA_ATTRIBUTE,
    { left: "0", transform: "translateY(-6px)" },
  )

export const CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE = "data-canvas-grid-overlay"

// The grid is invisible on the rendered page, so while a placement drag is in
// progress the editor draws temporary column and row guides directly on the
// rendered canvas, making the cells the block will snap to visible. Returns a
// cleanup that removes the guides and restores the canvas's positioning.
export const showCanvasGridOverlay = (
  canvas: HTMLElement,
  guideColor: string,
): (() => void) => {
  const view = canvas.ownerDocument.defaultView
  if (!view) {
    return () => undefined
  }
  const doc = canvas.ownerDocument
  const style = view.getComputedStyle(canvas)
  const rect = canvas.getBoundingClientRect()

  const paddingLeft = parsePx(style.paddingLeft)
  const paddingTop = parsePx(style.paddingTop)
  const paddingBottom = parsePx(style.paddingBottom)
  const columnGap = parsePx(style.columnGap)
  const contentWidth =
    rect.width -
    parsePx(style.borderLeftWidth) -
    parsePx(style.borderRightWidth) -
    paddingLeft -
    parsePx(style.paddingRight)
  const columnWidth =
    (contentWidth - columnGap * (CANVAS_GRID_COLUMNS - 1)) / CANVAS_GRID_COLUMNS
  // The canvas scrolls, so the guides must span the full content, not just
  // the visible box
  const contentHeight = Math.max(
    canvas.scrollHeight - paddingTop - paddingBottom,
    rect.height -
      parsePx(style.borderTopWidth) -
      parsePx(style.borderBottomWidth) -
      paddingTop -
      paddingBottom,
  )
  if (columnWidth <= 0 || contentHeight <= 0) {
    return () => undefined
  }

  // The overlay is positioned in the canvas's padding box (so it scrolls with
  // the content); the canvas renderer leaves the container statically
  // positioned, so make it the containing block for the overlay's lifetime
  const previousPosition = canvas.style.position
  canvas.style.position = "relative"

  const overlay = doc.createElement("div")
  overlay.setAttribute(CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE, "")
  overlay.setAttribute("aria-hidden", "true")
  Object.assign(overlay.style, {
    position: "absolute",
    left: `${paddingLeft}px`,
    top: `${paddingTop}px`,
    width: `${contentWidth}px`,
    height: `${contentHeight}px`,
    pointerEvents: "none",
  })

  for (let col = 0; col < CANVAS_GRID_COLUMNS; col++) {
    const columnGuide = doc.createElement("div")
    Object.assign(columnGuide.style, {
      position: "absolute",
      left: `${col * (columnWidth + columnGap)}px`,
      top: "0",
      width: `${columnWidth}px`,
      height: "100%",
      boxSizing: "border-box",
      border: `1px dashed ${guideColor}`,
      borderRadius: "2px",
      opacity: "0.35",
    })
    overlay.appendChild(columnGuide)
  }

  // A horizontal guide at each row boundary: through the used tracks first,
  // then base-height rows extrapolated to the bottom of the content
  const rowGap = parsePx(style.rowGap)
  const rowTracks = readRowTracks(style)
  let offset = 0
  for (let row = 0; row < CANVAS_MAX_ROW; row++) {
    offset += (rowTracks[row] ?? CANVAS_BASE_ROW_HEIGHT_PX) + rowGap
    if (offset >= contentHeight) {
      break
    }
    const rowGuide = doc.createElement("div")
    Object.assign(rowGuide.style, {
      position: "absolute",
      left: "0",
      right: "0",
      // Centre the guide within the row gap (gapless grids put it exactly on
      // the boundary)
      top: `${offset - rowGap / 2}px`,
      borderTop: `1px dashed ${guideColor}`,
      opacity: "0.35",
    })
    overlay.appendChild(rowGuide)
  }

  canvas.appendChild(overlay)
  return () => {
    overlay.remove()
    canvas.style.position = previousPosition
  }
}
