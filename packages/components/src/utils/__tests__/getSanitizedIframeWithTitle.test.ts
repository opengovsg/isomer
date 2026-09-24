import DOMPurify from "isomorphic-dompurify"
import { describe, expect, it } from "vitest"

import { getSanitizedIframeWithTitle } from "../getSanitizedIframeWithTitle"

describe("getSanitizedIframeWithTitle", () => {
  it("sanitizes iframe and sets accessibility attributes", () => {
    const iframe = getSanitizedIframeWithTitle(
      '<iframe src="https://example.com" onload="alert(1)"></iframe>',
      "My embed",
    )

    expect(iframe).not.toBeNull()
    expect(iframe?.tagName).toBe("IFRAME")
    expect(iframe?.getAttribute("src")).toBe("https://example.com")
    expect(iframe?.getAttribute("onload")).toBeNull()
    expect(iframe?.getAttribute("title")).toBe("My embed")
    expect(iframe?.getAttribute("height")).toBe("100%")
    expect(iframe?.getAttribute("width")).toBe("100%")
    expect(iframe?.getAttribute("class")).toBe(
      "absolute top-0 left-0 bottom-0 right-0",
    )
  })

  it("handles leading whitespace before the iframe", () => {
    const iframe = getSanitizedIframeWithTitle(
      '\n  <iframe src="https://example.com"></iframe>',
      "Whitespace embed",
    )

    expect(iframe).not.toBeNull()
    expect(iframe?.tagName).toBe("IFRAME")
    expect(iframe?.getAttribute("src")).toBe("https://example.com")
    expect(iframe?.getAttribute("title")).toBe("Whitespace embed")
  })

  it("returns null when sanitized content does not include an iframe", () => {
    expect(getSanitizedIframeWithTitle("", "Empty embed")).toBeNull()
    expect(getSanitizedIframeWithTitle("plain text", "Text embed")).toBeNull()
  })

  it("does not leak hooks across multiple calls", () => {
    for (let i = 0; i < 10; i++) {
      getSanitizedIframeWithTitle(
        `<iframe src="https://example.com/${i}"></iframe>`,
        `Title ${i}`,
      )
    }

    const unrelated = DOMPurify.sanitize(
      '<iframe src="https://other.com"></iframe>',
      {
        ALLOWED_TAGS: ["iframe"],
        RETURN_DOM_FRAGMENT: true,
      },
    ).firstChild as HTMLIFrameElement

    expect(unrelated.getAttribute("title")).toBeNull()
  })
})
