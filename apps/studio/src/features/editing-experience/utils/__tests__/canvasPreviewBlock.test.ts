// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"

import {
  findCanvasBlockPreviewElement,
  findPreviewDocumentWithCanvas,
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
