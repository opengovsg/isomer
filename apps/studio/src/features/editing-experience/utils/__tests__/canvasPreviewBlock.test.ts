// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  CANVAS_GRID_OVERLAY_DATA_ATTRIBUTE,
  CANVAS_SELECTION_HANDLE_DATA_ATTRIBUTE,
  findCanvasBlockPreviewElement,
  findCanvasPreviewContainer,
  findPreviewDocumentWithCanvas,
  resolveCanvasBlockGridArea,
  resolveCanvasGridCellFromPoint,
  resolveCanvasWidthPercent,
  showCanvasGridOverlay,
  showCanvasSelectionHandles,
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

  it("draws a resize handle on each corner of the block", () => {
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
    ])
    // Centred on the corner and hidden from assistive tech
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
    expect(handlesIn(block)).toHaveLength(4)

    cleanup()
    expect(handlesIn(block)).toHaveLength(0)
    expect(block.style.position).toBe("static")
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
