// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import type { CanvasSelectionToolbarAction } from "../canvasPreviewBlock"
import {
  CANVAS_DRAG_BADGE_DATA_ATTRIBUTE,
  CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE,
  CANVAS_HOVER_LABEL_DATA_ATTRIBUTE,
  CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE,
  CANVAS_SELECTION_TOOLBAR_DATA_ATTRIBUTE,
  CANVAS_SIZE_BADGE_DATA_ATTRIBUTE,
  CANVAS_TOOLBAR_ACTION_DATA_ATTRIBUTE,
  findCanvasBlockPreviewElement,
  findCanvasPreviewContainer,
  findPreviewDocumentWithCanvas,
  resolveCanvasBlockGridArea,
  resolveCanvasGridCellFromPoint,
  resolveCanvasWidthPercent,
  showCanvasDragBadge,
  showCanvasGridOverlay,
  showCanvasHoverLabel,
  showCanvasSelectionHandles,
  showCanvasSelectionToolbar,
  showCanvasSizeBadge,
} from "../canvasPreviewBlock"

const appendIframe = (bodyHtml: string): HTMLIFrameElement => {
  const iframe = document.createElement("iframe")
  document.body.appendChild(iframe)
  iframe.contentDocument!.body.innerHTML = bodyHtml
  return iframe
}

const CANVAS_MARKUP = `
  <div data-canvas-container="">
    <div data-canvas-block-index="0">first canvas, first block</div>
    <div data-canvas-block-index="1">first canvas, second block</div>
  </div>
  <div data-canvas-container="">
    <div data-canvas-block-index="0">second canvas, first block</div>
  </div>
`

afterEach(() => {
  document.body.innerHTML = ""
})

describe("findPreviewDocumentWithCanvas", () => {
  it("returns null when no iframe contains a rendered canvas", () => {
    appendIframe("<p>no canvas here</p>")

    expect(findPreviewDocumentWithCanvas(document)).toBeNull()
  })

  it("skips iframes without canvases and returns the preview document", () => {
    appendIframe("<p>no canvas here</p>")
    const previewIframe = appendIframe(CANVAS_MARKUP)

    expect(findPreviewDocumentWithCanvas(document)).toBe(
      previewIframe.contentDocument,
    )
  })
})

describe("resolveCanvasGridCellFromPoint", () => {
  // A canvas whose content box is 480px wide (12 × 40px columns when there
  // are no gaps) positioned at the viewport origin
  const makeCanvas = (
    style: Partial<CSSStyleDeclaration>,
    rect: Partial<DOMRect> = {},
  ): HTMLElement => {
    const canvas = document.createElement("div")
    document.body.appendChild(canvas)
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    })
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      columnGap: "",
      rowGap: "",
      paddingLeft: "",
      paddingRight: "",
      paddingTop: "",
      borderLeftWidth: "",
      borderRightWidth: "",
      borderTopWidth: "",
      gridTemplateRows: "none",
      ...style,
    } as CSSStyleDeclaration)
    return canvas
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("maps pointer positions to columns and base-height rows", () => {
    const canvas = makeCanvas({})

    // 40px columns, 32px base rows
    expect(resolveCanvasGridCellFromPoint(canvas, 5, 5)).toEqual({
      row: 1,
      col: 1,
    })
    expect(resolveCanvasGridCellFromPoint(canvas, 85, 40)).toEqual({
      row: 2,
      col: 3,
    })
    expect(resolveCanvasGridCellFromPoint(canvas, 475, 100)).toEqual({
      row: 4,
      col: 12,
    })
  })

  it("clamps positions outside the grid onto its edges", () => {
    const canvas = makeCanvas({})

    expect(resolveCanvasGridCellFromPoint(canvas, -50, -50)).toEqual({
      row: 1,
      col: 1,
    })
    expect(resolveCanvasGridCellFromPoint(canvas, 4000, 5)).toEqual({
      row: 1,
      col: 12,
    })
  })

  it("accounts for padding, borders and gaps", () => {
    // Content box: 480 - 2×(20 + 1) = 438 wide; columns are
    // (438 - 11×16) / 12 = 21.833… px with 16px gaps
    const canvas = makeCanvas(
      {
        columnGap: "16px",
        rowGap: "16px",
        paddingLeft: "20px",
        paddingRight: "20px",
        paddingTop: "20px",
        borderLeftWidth: "1px",
        borderRightWidth: "1px",
        borderTopWidth: "1px",
      },
      { width: 480 },
    )

    // Just inside the content box origin
    expect(resolveCanvasGridCellFromPoint(canvas, 22, 22)).toEqual({
      row: 1,
      col: 1,
    })
    // One column stride (21.833 + 16) past the origin
    expect(resolveCanvasGridCellFromPoint(canvas, 22 + 38, 22)).toEqual({
      row: 1,
      col: 2,
    })
    // One base row stride (32 + 16) below the origin
    expect(resolveCanvasGridCellFromPoint(canvas, 22, 22 + 48)).toEqual({
      row: 2,
      col: 1,
    })
  })

  it("uses the grid's used row tracks when the browser reports them", () => {
    const canvas = makeCanvas({
      gridTemplateRows: "48px 96px",
      rowGap: "16px",
    })

    // Within the first 48px track (and its trailing gap)
    expect(resolveCanvasGridCellFromPoint(canvas, 5, 60)?.row).toBe(1)
    // Within the stretched 96px second track
    expect(resolveCanvasGridCellFromPoint(canvas, 5, 150)?.row).toBe(2)
    // Past the last track: extrapolates with the 32px base row height,
    // starting after 48 + 16 + 96 + 16 = 176px
    expect(resolveCanvasGridCellFromPoint(canvas, 5, 180)?.row).toBe(3)
    expect(resolveCanvasGridCellFromPoint(canvas, 5, 176 + 48 + 5)?.row).toBe(4)
  })

  it("returns null when the canvas has no measurable width", () => {
    const canvas = makeCanvas({}, { width: 0 })

    expect(resolveCanvasGridCellFromPoint(canvas, 10, 10)).toBeNull()
  })
})

describe("resolveCanvasBlockGridArea", () => {
  // The same 480px-wide, gapless canvas as above: 40px columns, 32px rows
  const makeCanvas = (): HTMLElement => {
    const canvas = document.createElement("div")
    document.body.appendChild(canvas)
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      columnGap: "",
      rowGap: "",
      paddingLeft: "",
      paddingRight: "",
      paddingTop: "",
      borderLeftWidth: "",
      borderRightWidth: "",
      borderTopWidth: "",
      gridTemplateRows: "none",
    } as CSSStyleDeclaration)
    return canvas
  }

  const makeBlock = (canvas: HTMLElement, rect: Partial<DOMRect>) => {
    const block = document.createElement("div")
    canvas.appendChild(block)
    block.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 0,
      height: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    })
    return block
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("maps a full-width stacked block's rect to the cells it covers", () => {
    const canvas = makeCanvas()
    const block = makeBlock(canvas, {
      left: 0,
      top: 0,
      width: 480,
      height: 64,
      right: 480,
      bottom: 64,
    })

    expect(resolveCanvasBlockGridArea(canvas, block)).toEqual({
      colStart: 1,
      colEnd: 12,
      rowStart: 1,
      rowEnd: 2,
    })
  })

  it("does not bleed into neighbouring cells when edges sit on boundaries", () => {
    const canvas = makeCanvas()
    // Exactly columns 2-3 (x 40-120) and row 2 (y 32-64)
    const block = makeBlock(canvas, {
      left: 40,
      top: 32,
      width: 80,
      height: 32,
      right: 120,
      bottom: 64,
    })

    expect(resolveCanvasBlockGridArea(canvas, block)).toEqual({
      colStart: 2,
      colEnd: 3,
      rowStart: 2,
      rowEnd: 2,
    })
  })

  it("returns null for a block with no measurable size", () => {
    const canvas = makeCanvas()
    const block = makeBlock(canvas, {})

    expect(resolveCanvasBlockGridArea(canvas, block)).toBeNull()
  })
})

describe("showCanvasGridOverlay", () => {
  // A canvas whose content box is 480px wide and 320px tall (12 × 40px
  // columns and 10 × 32px base rows when there are no gaps)
  const makeCanvas = (
    style: Partial<CSSStyleDeclaration> = {},
    rect: Partial<DOMRect> = {},
  ): HTMLElement => {
    const canvas = document.createElement("div")
    document.body.appendChild(canvas)
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 480,
      height: 320,
      right: 480,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      ...rect,
    })
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      columnGap: "",
      rowGap: "",
      paddingLeft: "",
      paddingRight: "",
      paddingTop: "",
      paddingBottom: "",
      borderLeftWidth: "",
      borderRightWidth: "",
      borderTopWidth: "",
      borderBottomWidth: "",
      gridTemplateRows: "none",
      ...style,
    } as CSSStyleDeclaration)
    return canvas
  }

  const overlayIn = (canvas: HTMLElement) =>
    canvas.querySelector<HTMLElement>(`[${CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE}]`)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("draws 12 column guides and base-height row guides over the content box", () => {
    const canvas = makeCanvas()

    showCanvasGridOverlay(canvas, "#1361F0")

    const overlay = overlayIn(canvas)
    expect(overlay).not.toBeNull()
    expect(overlay!.style.width).toBe("480px")
    expect(overlay!.style.height).toBe("320px")
    expect(overlay!.style.pointerEvents).toBe("none")

    const children = Array.from(overlay!.children) as HTMLElement[]
    const columnGuides = children.filter(
      (child) => child.style.height === "100%",
    )
    const rowGuides = children.filter((child) => child.style.height !== "100%")
    expect(columnGuides).toHaveLength(12)
    expect(columnGuides[0]!.style.left).toBe("0px")
    expect(columnGuides[1]!.style.left).toBe("40px")
    expect(columnGuides[11]!.style.left).toBe("440px")
    expect(columnGuides[0]!.style.width).toBe("40px")

    // Row boundaries every 32px, up to (but excluding) the bottom edge
    expect(rowGuides).toHaveLength(9)
    expect(rowGuides[0]!.style.top).toBe("32px")
    expect(rowGuides[8]!.style.top).toBe("288px")
  })

  it("places row guides through the used tracks, then extrapolates base rows", () => {
    const canvas = makeCanvas({
      gridTemplateRows: "48px 96px",
      rowGap: "16px",
    })

    showCanvasGridOverlay(canvas, "#1361F0")

    const rowGuides = (
      Array.from(overlayIn(canvas)!.children) as HTMLElement[]
    ).filter((child) => child.style.height !== "100%")
    // Boundaries at 64 and 176 (mid-gap: -8px), then base 32+16 strides
    expect(rowGuides.map((guide) => guide.style.top)).toEqual([
      "56px",
      "168px",
      "216px",
      "264px",
    ])
  })

  it("restores the canvas positioning and removes the guides on cleanup", () => {
    const canvas = makeCanvas()

    const cleanup = showCanvasGridOverlay(canvas, "#1361F0")
    expect(canvas.style.position).toBe("relative")
    expect(overlayIn(canvas)).not.toBeNull()

    cleanup()
    expect(overlayIn(canvas)).toBeNull()
    expect(canvas.style.position).toBe("")
  })

  it("does nothing when the canvas has no measurable size", () => {
    const canvas = makeCanvas({}, { width: 0 })

    const cleanup = showCanvasGridOverlay(canvas, "#1361F0")
    expect(overlayIn(canvas)).toBeNull()
    expect(canvas.style.position).toBe("")
    cleanup()
  })
})

describe("showCanvasSelectionHandles", () => {
  const handlesIn = (block: HTMLElement) =>
    Array.from(
      block.querySelectorAll<HTMLElement>(
        `[${CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE}]`,
      ),
    )

  it("draws a resize handle on each corner and edge midpoint of the block", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)

    showCanvasSelectionHandles(block, "#1361F0")

    expect(block.style.position).toBe("relative")
    const handles = handlesIn(block)
    expect(
      handles.map((handle) => [
        handle.getAttribute(CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE),
        handle.style.top,
        handle.style.left,
        handle.style.cursor,
      ]),
    ).toEqual([
      ["top-left", "0%", "0%", "nwse-resize"],
      ["top-right", "0%", "100%", "nesw-resize"],
      ["bottom-left", "100%", "0%", "nesw-resize"],
      ["bottom-right", "100%", "100%", "nwse-resize"],
      ["top", "0%", "50%", "ns-resize"],
      ["bottom", "100%", "50%", "ns-resize"],
      ["left", "50%", "0%", "ew-resize"],
      ["right", "50%", "100%", "ew-resize"],
    ])
    // Centred on the corner/edge and hidden from assistive tech
    handles.forEach((handle) => {
      expect(handle.style.transform).toBe("translate(-50%, -50%)")
      expect(handle.getAttribute("aria-hidden")).toBe("true")
    })
  })

  it("removes the handles and restores the block positioning on cleanup", () => {
    const block = document.createElement("div")
    block.style.position = "static"
    document.body.appendChild(block)

    const cleanup = showCanvasSelectionHandles(block, "#1361F0")
    expect(handlesIn(block)).toHaveLength(8)

    cleanup()
    expect(handlesIn(block)).toHaveLength(0)
    expect(block.style.position).toBe("static")
  })
})

describe("showCanvasDragBadge", () => {
  const badgeIn = (block: HTMLElement) =>
    block.querySelector<HTMLElement>(`[${CANVAS_DRAG_BADGE_DATA_ATTRIBUTE}]`)

  it("pins a badge with the grid-area text above the block", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)

    showCanvasDragBadge(block, "Columns 3–8, rows 2–4", "#1361F0")

    expect(block.style.position).toBe("relative")
    const badge = badgeIn(block)!
    expect(badge.textContent).toBe("Columns 3–8, rows 2–4")
    expect(badge.getAttribute("aria-hidden")).toBe("true")
    expect(badge.style.position).toBe("absolute")
    expect(badge.style.bottom).toBe("100%")
    expect(badge.style.pointerEvents).toBe("none")
  })

  it("removes the badge and restores positioning on cleanup", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)

    const cleanup = showCanvasDragBadge(
      block,
      "Columns 1–1, rows 1–1",
      "#1361F0",
    )
    expect(badgeIn(block)).not.toBeNull()

    cleanup()
    expect(badgeIn(block)).toBeNull()
    expect(block.style.position).toBe("")
  })

  it("leaves positioning owned by another affordance untouched", () => {
    // The selection handles already make the block a containing block while
    // its editor is open; the badge must not clobber that on cleanup
    const block = document.createElement("div")
    block.style.position = "relative"
    document.body.appendChild(block)

    const cleanup = showCanvasDragBadge(
      block,
      "Columns 2–5, rows 1–2",
      "#1361F0",
    )
    expect(block.style.position).toBe("relative")

    cleanup()
    expect(block.style.position).toBe("relative")
  })
})

describe("showCanvasHoverLabel", () => {
  const labelIn = (block: HTMLElement) =>
    block.querySelector<HTMLElement>(`[${CANVAS_HOVER_LABEL_DATA_ATTRIBUTE}]`)

  it("pins a chip naming the block at its top-left corner", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)

    showCanvasHoverLabel(block, "Quote", "#1361F0")

    expect(block.style.position).toBe("relative")
    const label = labelIn(block)!
    expect(label.textContent).toBe("Quote")
    expect(label.getAttribute("aria-hidden")).toBe("true")
    expect(label.style.position).toBe("absolute")
    expect(label.style.bottom).toBe("100%")
    expect(label.style.left).toBe("0px")
    expect(label.style.pointerEvents).toBe("none")
  })

  it("removes the label and restores positioning on cleanup", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)

    const cleanup = showCanvasHoverLabel(block, "Image", "#1361F0")
    expect(labelIn(block)).not.toBeNull()

    cleanup()
    expect(labelIn(block)).toBeNull()
    expect(block.style.position).toBe("")
  })
})

describe("showCanvasSizeBadge", () => {
  const stubRect = (
    element: HTMLElement,
    size: { right: number; bottom: number },
  ) => {
    element.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: size.right,
      height: size.bottom,
      right: size.right,
      bottom: size.bottom,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  }

  const badgeIn = (doc: Document) =>
    doc.querySelector<HTMLElement>(`[${CANVAS_SIZE_BADGE_DATA_ATTRIBUTE}]`)

  it("pins a fixed chip in the document and positions it at the canvas's bottom-right corner on update", () => {
    const canvas = document.createElement("div")
    document.body.appendChild(canvas)
    stubRect(canvas, { right: 600, bottom: 400 })

    const sizeBadge = showCanvasSizeBadge(canvas, "#1361F0")
    // Fixed positioning in the document body: a child of the canvas would
    // scroll with the content and be clipped by the canvas's own overflow
    const badge = badgeIn(document)!
    expect(badge.parentElement).toBe(document.body)
    expect(badge.style.position).toBe("fixed")
    expect(badge.getAttribute("aria-hidden")).toBe("true")
    expect(badge.style.pointerEvents).toBe("none")

    sizeBadge.update("60% × 400px")
    expect(badge.textContent).toBe("60% × 400px")
    expect(badge.style.left).toBe("594px")
    expect(badge.style.top).toBe("394px")
  })

  it("follows the moving corner across updates", () => {
    const canvas = document.createElement("div")
    document.body.appendChild(canvas)
    const size = { right: 600, bottom: 400 }
    stubRect(canvas, size)

    const sizeBadge = showCanvasSizeBadge(canvas, "#1361F0")
    sizeBadge.update("60% × 400px")

    size.right = 800
    size.bottom = 500
    sizeBadge.update("80% × 500px")
    const badge = badgeIn(document)!
    expect(badge.textContent).toBe("80% × 500px")
    expect(badge.style.left).toBe("794px")
    expect(badge.style.top).toBe("494px")
  })

  it("removes the chip on cleanup", () => {
    const canvas = document.createElement("div")
    document.body.appendChild(canvas)
    stubRect(canvas, { right: 600, bottom: 400 })

    const sizeBadge = showCanvasSizeBadge(canvas, "#1361F0")
    expect(badgeIn(document)).not.toBeNull()

    sizeBadge.cleanup()
    expect(badgeIn(document)).toBeNull()
  })
})

describe("showCanvasSelectionToolbar", () => {
  const toolbarIn = (block: HTMLElement) =>
    block.querySelector<HTMLElement>(
      `[${CANVAS_SELECTION_TOOLBAR_DATA_ATTRIBUTE}]`,
    )

  const ACTIONS = (
    onDuplicate: () => void,
    onDelete: () => void,
  ): CanvasSelectionToolbarAction[] => [
    {
      name: "duplicate",
      label: "Duplicate block (⌘D)",
      glyph: "⧉",
      onClick: onDuplicate,
    },
    {
      name: "delete",
      label: "Delete block (Delete)",
      glyph: "✕",
      disabled: true,
      onClick: onDelete,
    },
  ]

  it("pins labelled action buttons above the block and activates them on click", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()

    showCanvasSelectionToolbar(block, ACTIONS(onDuplicate, onDelete), "#1361F0")

    expect(block.style.position).toBe("relative")
    const toolbar = toolbarIn(block)!
    expect(toolbar.getAttribute("role")).toBe("toolbar")
    expect(toolbar.style.position).toBe("absolute")
    expect(toolbar.style.bottom).toBe("100%")
    expect(toolbar.style.pointerEvents).toBe("auto")

    const buttons = Array.from(toolbar.querySelectorAll("button"))
    expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
      "Duplicate block (⌘D)",
      "Delete block (Delete)",
    ])
    expect(
      buttons.map((button) =>
        button.getAttribute(CANVAS_TOOLBAR_ACTION_DATA_ATTRIBUTE),
      ),
    ).toEqual(["duplicate", "delete"])

    buttons[0]!.click()
    expect(onDuplicate).toHaveBeenCalledTimes(1)

    // A disabled action renders visibly muted and never fires
    expect(buttons[1]!.disabled).toBe(true)
    buttons[1]!.click()
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("keeps toolbar presses away from the block's drag listeners", () => {
    // The toolbar sits inside the selected block, whose mousedown starts a
    // placement drag — pressing a button must not bubble into a grab
    const block = document.createElement("div")
    document.body.appendChild(block)
    const onBlockMousedown = vi.fn()
    const onBlockClick = vi.fn()
    block.addEventListener("mousedown", onBlockMousedown)
    block.addEventListener("click", onBlockClick)

    showCanvasSelectionToolbar(
      block,
      ACTIONS(
        () => undefined,
        () => undefined,
      ),
      "#1361F0",
    )
    const button = toolbarIn(block)!.querySelector("button")!
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    expect(onBlockMousedown).not.toHaveBeenCalled()
    expect(onBlockClick).not.toHaveBeenCalled()
  })

  it("removes the toolbar and restores positioning on cleanup, leaving another affordance's positioning untouched", () => {
    const block = document.createElement("div")
    document.body.appendChild(block)

    const cleanup = showCanvasSelectionToolbar(
      block,
      ACTIONS(
        () => undefined,
        () => undefined,
      ),
      "#1361F0",
    )
    expect(toolbarIn(block)).not.toBeNull()
    cleanup()
    expect(toolbarIn(block)).toBeNull()
    expect(block.style.position).toBe("")

    // The selection handles already made the block a containing block; the
    // toolbar must not clobber that on cleanup
    block.style.position = "relative"
    const gatedCleanup = showCanvasSelectionToolbar(
      block,
      ACTIONS(
        () => undefined,
        () => undefined,
      ),
      "#1361F0",
    )
    gatedCleanup()
    expect(block.style.position).toBe("relative")
  })
})

describe("findCanvasBlockPreviewElement", () => {
  it("finds a block wrapper by canvas ordinal and block index", () => {
    appendIframe(CANVAS_MARKUP)

    expect(findCanvasBlockPreviewElement(document, 0, 1)?.textContent).toBe(
      "first canvas, second block",
    )
    expect(findCanvasBlockPreviewElement(document, 1, 0)?.textContent).toBe(
      "second canvas, first block",
    )
  })

  it("returns null for out-of-range ordinals and block indices", () => {
    appendIframe(CANVAS_MARKUP)

    expect(findCanvasBlockPreviewElement(document, 2, 0)).toBeNull()
    expect(findCanvasBlockPreviewElement(document, 1, 1)).toBeNull()
  })
})

describe("findCanvasPreviewContainer", () => {
  it("returns the nth rendered canvas in the preview document", () => {
    appendIframe(CANVAS_MARKUP)

    expect(findCanvasPreviewContainer(document, 1)?.textContent).toContain(
      "second canvas, first block",
    )
  })

  it("returns null when the ordinal is out of range", () => {
    appendIframe(CANVAS_MARKUP)

    expect(findCanvasPreviewContainer(document, 2)).toBeNull()
  })
})

describe("resolveCanvasWidthPercent", () => {
  const stubRectWidth = (element: HTMLElement, width: number) => {
    element.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width,
      height: 100,
      right: width,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("resolves the canvas width against the parent's content box", () => {
    const parent = document.createElement("div")
    const canvas = document.createElement("div")
    parent.appendChild(canvas)
    document.body.appendChild(parent)
    stubRectWidth(parent, 1000)
    stubRectWidth(canvas, 450)
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      paddingLeft: "50px",
      paddingRight: "50px",
      borderLeftWidth: "",
      borderRightWidth: "",
    } as CSSStyleDeclaration)

    // 450px of the parent's 900px content box
    expect(resolveCanvasWidthPercent(canvas)).toBe(50)
  })

  it("returns null when the parent has no measurable width", () => {
    const parent = document.createElement("div")
    const canvas = document.createElement("div")
    parent.appendChild(canvas)
    document.body.appendChild(parent)
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      paddingLeft: "",
      paddingRight: "",
      borderLeftWidth: "",
      borderRightWidth: "",
    } as CSSStyleDeclaration)

    expect(resolveCanvasWidthPercent(canvas)).toBeNull()
  })
})
