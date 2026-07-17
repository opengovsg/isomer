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
export const findCanvasBlockPreviewElement = (
  doc: Document,
  canvasOrdinal: number,
  blockIndex: number,
): HTMLElement | null => {
  const previewDocument = findPreviewDocumentWithCanvas(doc)
  const canvas = previewDocument
    ?.querySelectorAll(`[${CANVAS_CONTAINER_DATA_ATTRIBUTE}]`)
    .item(canvasOrdinal)
  return (
    canvas?.querySelector<HTMLElement>(
      `[${CANVAS_BLOCK_INDEX_DATA_ATTRIBUTE}="${blockIndex}"]`,
    ) ?? null
  )
}

export interface CanvasGridCell {
  row: number
  col: number
}

// Matches the Canvas renderer's auto-rows-[minmax(2rem,auto)] base row height
const CANVAS_BASE_ROW_HEIGHT_PX = 32
// The placement schema bounds row values at 100
const CANVAS_MAX_ROW = 100

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
