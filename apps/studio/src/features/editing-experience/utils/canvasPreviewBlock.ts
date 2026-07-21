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

// A grabbed rectangle's col:row span ratio, carried by corner resizes so
// holding Shift can keep the rectangle's proportions; the dir fields point
// from the anchor toward the grabbed corner, for sweeps with no extent on
// one axis
export interface CanvasSpanRatio {
  cols: number
  rows: number
  rowDir: 1 | -1
  colDir: 1 | -1
}

// Holding Shift while dragging a corner keeps the grabbed rectangle's
// proportions, Wix-style: the axis the pointer has swept proportionally
// further leads, and the other axis is derived from the rectangle's col:row
// span ratio — clamped to the grid, so the proportions can bend at its edges
export const proportionalCanvasGridCell = (
  anchor: CanvasGridCell,
  cell: CanvasGridCell,
  ratio: CanvasSpanRatio,
): CanvasGridCell => {
  const cols = Math.abs(cell.col - anchor.col) + 1
  const rows = Math.abs(cell.row - anchor.row) + 1
  if (cols * ratio.rows >= rows * ratio.cols) {
    const rowDir = Math.sign(cell.row - anchor.row) || ratio.rowDir
    const derivedRows = Math.max(
      1,
      Math.round((cols * ratio.rows) / ratio.cols),
    )
    return {
      col: cell.col,
      row: clamp(anchor.row + rowDir * (derivedRows - 1), 1, CANVAS_MAX_ROW),
    }
  }
  const colDir = Math.sign(cell.col - anchor.col) || ratio.colDir
  const derivedCols = Math.max(1, Math.round((rows * ratio.cols) / ratio.rows))
  return {
    row: cell.row,
    col: clamp(anchor.col + colDir * (derivedCols - 1), 1, CANVAS_GRID_COLUMNS),
  }
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

export const CANVAS_GROUP_BOUNDING_BOX_DATA_ATTRIBUTE =
  "data-canvas-group-bounding-box"
export const CANVAS_GROUP_RESIZE_HANDLE_DATA_ATTRIBUTE =
  "data-canvas-group-resize-handle"

const GROUP_RESIZE_HANDLES = [
  { name: "top-left", top: "0%", left: "0%", cursor: "nwse-resize" },
  { name: "top-right", top: "0%", left: "100%", cursor: "nesw-resize" },
  { name: "bottom-left", top: "100%", left: "0%", cursor: "nesw-resize" },
  { name: "bottom-right", top: "100%", left: "100%", cursor: "nwse-resize" },
  { name: "top", top: "0%", left: "50%", cursor: "ns-resize" },
  { name: "right", top: "50%", left: "100%", cursor: "ew-resize" },
  { name: "bottom", top: "100%", left: "50%", cursor: "ns-resize" },
  { name: "left", top: "50%", left: "0%", cursor: "ew-resize" },
] as const

export type CanvasGroupResizeHandle =
  (typeof GROUP_RESIZE_HANDLES)[number]["name"]

// Wix-style group bounding box: while a multi-selection with placed members
// is idle, a rectangle around the members' combined footprint shows corner
// and edge-midpoint resize handles — grabbing a corner scales the whole
// group on both axes, grabbing an edge on that edge's axis only. The box
// lives in the preview document body with fixed positioning (viewport
// coords match fixed coords inside the iframe) so the canvas's own overflow
// never clips it; the box itself passes pointer events through, only the
// handles are grabbable. Returns a cleanup that removes the box and its
// handles.
export const showCanvasGroupResizeHandles = (
  doc: Document,
  rect: { left: number; top: number; width: number; height: number },
  handleColor: string,
  onGrab: (handle: CanvasGroupResizeHandle, event: MouseEvent) => void,
): (() => void) => {
  const box = doc.createElement("div")
  box.setAttribute(CANVAS_GROUP_BOUNDING_BOX_DATA_ATTRIBUTE, "")
  box.setAttribute("aria-hidden", "true")
  Object.assign(box.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    boxSizing: "border-box",
    border: `1px solid ${handleColor}`,
    pointerEvents: "none",
    zIndex: "3",
  })
  GROUP_RESIZE_HANDLES.forEach(({ name, top, left, cursor }) => {
    const handle = doc.createElement("div")
    handle.setAttribute(CANVAS_GROUP_RESIZE_HANDLE_DATA_ATTRIBUTE, name)
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
      pointerEvents: "auto",
    })
    handle.addEventListener("mousedown", (event) => {
      if (event.button !== 0) {
        return
      }
      // Keep the press from starting text selection; the handle sits outside
      // the canvas so no canvas gesture can double-handle it
      event.preventDefault()
      onGrab(name, event)
    })
    box.appendChild(handle)
  })
  doc.body.appendChild(box)
  return () => {
    box.remove()
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

export const CANVAS_SIZE_BADGE_DATA_ATTRIBUTE = "data-canvas-size-badge"

export interface CanvasSizeBadge {
  update: (text: string) => void
  cleanup: () => void
}

// Wix-style live size readout: while the canvas's resize handle is being
// dragged, a chip just inside the bottom-right corner (where the pointer is
// holding the handle) shows the size the drag will commit on release. The
// chip lives in the preview document body with fixed positioning — as a
// child of the canvas it would scroll with the content and be clipped by
// the canvas's own overflow — and is repositioned from the canvas's live
// rect on every update because the resize moves the corner it is pinned to.
export const showCanvasSizeBadge = (
  canvas: HTMLElement,
  badgeColor: string,
): CanvasSizeBadge => {
  const chip = canvas.ownerDocument.createElement("div")
  chip.setAttribute(CANVAS_SIZE_BADGE_DATA_ATTRIBUTE, "")
  chip.setAttribute("aria-hidden", "true")
  Object.assign(chip.style, {
    position: "fixed",
    transform: "translate(-100%, -100%)",
    backgroundColor: badgeColor,
    color: "#ffffff",
    fontSize: "12px",
    lineHeight: "1.4",
    padding: "2px 8px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: "2",
  })
  canvas.ownerDocument.body.appendChild(chip)
  return {
    update: (text: string) => {
      chip.textContent = text
      const rect = canvas.getBoundingClientRect()
      chip.style.left = `${rect.right - 6}px`
      chip.style.top = `${rect.bottom - 6}px`
    },
    cleanup: () => {
      chip.remove()
    },
  }
}

export const CANVAS_MARQUEE_DATA_ATTRIBUTE = "data-canvas-marquee"

export interface CanvasMarqueeRectangle {
  update: (rect: {
    left: number
    top: number
    width: number
    height: number
  }) => void
  cleanup: () => void
}

// Wix-style rubber-band marquee: while a press on the empty canvas
// background sweeps out a multi-selection, a tinted rectangle stretches
// between the press point and the pointer. It lives in the preview document
// body with fixed positioning (viewport coords match fixed coords inside
// the iframe) so the canvas's own overflow never clips it, and is
// repositioned through update on every pointer move.
export const showCanvasMarqueeRectangle = (
  doc: Document,
  marqueeColor: string,
): CanvasMarqueeRectangle => {
  const rectangle = doc.createElement("div")
  rectangle.setAttribute(CANVAS_MARQUEE_DATA_ATTRIBUTE, "")
  rectangle.setAttribute("aria-hidden", "true")
  Object.assign(rectangle.style, {
    position: "fixed",
    boxSizing: "border-box",
    border: `1px solid ${marqueeColor}`,
    // A hex-alpha fill tints the swept area without obscuring the blocks
    // being selected
    backgroundColor: `${marqueeColor}20`,
    pointerEvents: "none",
    zIndex: "3",
  })
  doc.body.appendChild(rectangle)
  return {
    update: ({ left, top, width, height }) => {
      rectangle.style.left = `${left}px`
      rectangle.style.top = `${top}px`
      rectangle.style.width = `${width}px`
      rectangle.style.height = `${height}px`
    },
    cleanup: () => {
      rectangle.remove()
    },
  }
}

export const CANVAS_SELECTION_TOOLBAR_DATA_ATTRIBUTE =
  "data-canvas-selection-toolbar"
export const CANVAS_TOOLBAR_ACTION_DATA_ATTRIBUTE = "data-canvas-toolbar-action"

export interface CanvasSelectionToolbarAction {
  name: string
  label: string
  glyph: string
  disabled?: boolean
  onClick: () => void
}

// Wix-style action toolbar: while a block's editor is open, a row of buttons
// pinned above the block's top-right corner offers the selection actions
// (duplicate, arrange, delete) to the mouse, mirroring the keyboard
// shortcuts. Returns a cleanup that removes the toolbar; it only touches the
// block's positioning when nothing else (e.g. the selection handles) has
// already made the block a containing block.
export const showCanvasSelectionToolbar = (
  block: HTMLElement,
  actions: CanvasSelectionToolbarAction[],
  toolbarColor: string,
  ariaLabel = "Block actions",
): (() => void) => {
  const appliedPosition = block.style.position === ""
  if (appliedPosition) {
    block.style.position = "relative"
  }
  const doc = block.ownerDocument
  const toolbar = doc.createElement("div")
  toolbar.setAttribute(CANVAS_SELECTION_TOOLBAR_DATA_ATTRIBUTE, "")
  toolbar.setAttribute("role", "toolbar")
  toolbar.setAttribute("aria-label", ariaLabel)
  Object.assign(toolbar.style, {
    position: "absolute",
    bottom: "100%",
    right: "0",
    transform: "translateY(-6px)",
    display: "flex",
    gap: "2px",
    backgroundColor: toolbarColor,
    borderRadius: "4px",
    padding: "2px",
    pointerEvents: "auto",
    zIndex: "2",
  })
  // The toolbar sits inside the selected block, whose presses start a
  // placement drag and whose clicks are canvas click-to-edit targets —
  // presses on the toolbar are button activations, not grabs
  toolbar.addEventListener("mousedown", (event) => event.stopPropagation())
  toolbar.addEventListener("click", (event) => event.stopPropagation())
  actions.forEach((action) => {
    const button = doc.createElement("button")
    button.type = "button"
    button.setAttribute(CANVAS_TOOLBAR_ACTION_DATA_ATTRIBUTE, action.name)
    button.setAttribute("aria-label", action.label)
    button.title = action.label
    button.textContent = action.glyph
    button.disabled = action.disabled ?? false
    Object.assign(button.style, {
      backgroundColor: "transparent",
      color: "#ffffff",
      border: "none",
      borderRadius: "2px",
      padding: "2px 6px",
      fontSize: "12px",
      lineHeight: "1.4",
      cursor: button.disabled ? "default" : "pointer",
      opacity: button.disabled ? "0.4" : "1",
    })
    button.addEventListener("click", action.onClick)
    toolbar.appendChild(button)
  })
  block.appendChild(toolbar)
  return () => {
    toolbar.remove()
    if (appliedPosition) {
      block.style.position = ""
    }
  }
}

export const CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE = "data-canvas-context-menu"

// Wix-style right-click context menu: a vertical list of the selection
// actions opened at the pointer, mirroring the floating toolbar and the
// keyboard shortcuts. The menu lives in the preview document body with fixed
// positioning (viewport coords match fixed coords inside the iframe) so it
// is never clipped by the canvas's own overflow. Returns a cleanup that
// removes it; dismissal (click-away, Escape) is the caller's concern.
export const showCanvasContextMenu = (
  doc: Document,
  position: { clientX: number; clientY: number },
  actions: CanvasSelectionToolbarAction[],
  menuColor: string,
): (() => void) => {
  const menu = doc.createElement("div")
  menu.setAttribute(CANVAS_CONTEXT_MENU_DATA_ATTRIBUTE, "")
  menu.setAttribute("role", "menu")
  menu.setAttribute("aria-label", "Block actions")
  Object.assign(menu.style, {
    position: "fixed",
    left: `${position.clientX}px`,
    top: `${position.clientY}px`,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    backgroundColor: menuColor,
    borderRadius: "4px",
    padding: "2px",
    // The menu can render in the Studio window (opened from a sidebar block
    // list row), so it must clear Studio's own stacked chrome, not just the
    // preview affordances
    zIndex: "1500",
  })
  // Right-clicking the menu itself must not open the browser's native menu
  // on top of it
  menu.addEventListener("contextmenu", (event) => event.preventDefault())
  actions.forEach((action) => {
    const item = doc.createElement("button")
    item.type = "button"
    item.setAttribute(CANVAS_TOOLBAR_ACTION_DATA_ATTRIBUTE, action.name)
    item.setAttribute("role", "menuitem")
    item.textContent = action.label
    item.disabled = action.disabled ?? false
    Object.assign(item.style, {
      backgroundColor: "transparent",
      color: "#ffffff",
      border: "none",
      borderRadius: "2px",
      padding: "4px 12px",
      fontSize: "12px",
      lineHeight: "1.4",
      textAlign: "left",
      whiteSpace: "nowrap",
      cursor: item.disabled ? "default" : "pointer",
      opacity: item.disabled ? "0.4" : "1",
    })
    item.addEventListener("click", action.onClick)
    menu.appendChild(item)
  })
  doc.body.appendChild(menu)
  return () => {
    menu.remove()
  }
}

export const CANVAS_ALIGNMENT_GUIDES_DATA_ATTRIBUTE =
  "data-canvas-alignment-guides"

export interface CanvasAlignmentLines {
  // 1-based grid line indices: column line n sits before column n, so the
  // last line is CANVAS_GRID_COLUMNS + 1; row lines count the same way
  cols: number[]
  rows: number[]
}

// Wix-style alignment guides: while a placement drag is in progress, any
// edge of the dragged selection that sits on the same grid line as a sibling
// block's edge is drawn as a solid line through the preview canvas, so flush
// alignment (and edge-to-edge adjacency) is visible the moment it happens.
// Returns a cleanup that removes the guides; it only touches the canvas's
// positioning when nothing else (e.g. the grid overlay, which is always up
// during a drag) has already made it a containing block.
export const showCanvasAlignmentGuides = (
  canvas: HTMLElement,
  lines: CanvasAlignmentLines,
  guideColor: string,
): (() => void) => {
  const view = canvas.ownerDocument.defaultView
  if (!view || (lines.cols.length === 0 && lines.rows.length === 0)) {
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

  // Interior lines sit in the middle of the gap (exactly on the boundary for
  // gapless grids); the first and last lines sit on the content box edges
  const colLineOffset = (line: number): number =>
    line <= 1
      ? 0
      : line > CANVAS_GRID_COLUMNS
        ? contentWidth
        : (line - 1) * (columnWidth + columnGap) - columnGap / 2
  const rowGap = parsePx(style.rowGap)
  const rowTracks = readRowTracks(style)
  const rowLineOffset = (line: number): number => {
    if (line <= 1) {
      return 0
    }
    let offset = 0
    for (let row = 0; row < line - 1; row++) {
      offset += (rowTracks[row] ?? CANVAS_BASE_ROW_HEIGHT_PX) + rowGap
    }
    return Math.min(offset - rowGap / 2, contentHeight)
  }

  const appliedPosition = canvas.style.position === ""
  if (appliedPosition) {
    canvas.style.position = "relative"
  }

  const overlay = doc.createElement("div")
  overlay.setAttribute(CANVAS_ALIGNMENT_GUIDES_DATA_ATTRIBUTE, "")
  overlay.setAttribute("aria-hidden", "true")
  Object.assign(overlay.style, {
    position: "absolute",
    left: `${paddingLeft}px`,
    top: `${paddingTop}px`,
    width: `${contentWidth}px`,
    height: `${contentHeight}px`,
    pointerEvents: "none",
  })

  lines.cols.forEach((line) => {
    const guide = doc.createElement("div")
    Object.assign(guide.style, {
      position: "absolute",
      left: `${colLineOffset(line) - 1}px`,
      top: "0",
      width: "2px",
      height: "100%",
      backgroundColor: guideColor,
    })
    overlay.appendChild(guide)
  })
  lines.rows.forEach((line) => {
    const guide = doc.createElement("div")
    Object.assign(guide.style, {
      position: "absolute",
      left: "0",
      right: "0",
      top: `${rowLineOffset(line) - 1}px`,
      height: "2px",
      backgroundColor: guideColor,
    })
    overlay.appendChild(guide)
  })

  canvas.appendChild(overlay)
  return () => {
    overlay.remove()
    if (appliedPosition) {
      canvas.style.position = ""
    }
  }
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
