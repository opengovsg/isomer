import type { IsomerSchema } from "@opengovsg/isomer-components"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  getBlockElement,
  getContentIndexFromDomIndex,
} from "../getBlockElement"

// Mirrors packages/components' rendering rules well enough to exercise the
// index math: each content block becomes one or more direct children of
// `[data-isomer-content-blocks]`, in order.
const renderContainer = (domChildTags: string[]): HTMLElement => {
  const container = document.createElement("div")
  container.setAttribute("data-isomer-content-blocks", "")
  domChildTags.forEach((tag) => {
    container.appendChild(document.createElement(tag))
  })
  document.body.appendChild(container)
  return container
}

describe("getBlockElement / getContentIndexFromDomIndex", () => {
  let container: HTMLElement | null = null

  afterEach(() => {
    container?.remove()
    container = null
  })

  describe("blocks that render as a single DOM node", () => {
    beforeEach(() => {
      container = renderContainer(["div", "div", "div"])
    })

    it("maps content index to the DOM child at the same position", () => {
      const content = [
        { type: "hero" },
        { type: "image" },
        { type: "callout" },
      ] as unknown as IsomerSchema["content"]

      expect(getBlockElement(document, content, 0)).toBe(container?.children[0])
      expect(getBlockElement(document, content, 1)).toBe(container?.children[1])
      expect(getBlockElement(document, content, 2)).toBe(container?.children[2])
    })

    it("maps a DOM index back to the same content index", () => {
      const content = [
        { type: "hero" },
        { type: "image" },
        { type: "callout" },
      ] as unknown as IsomerSchema["content"]

      expect(getContentIndexFromDomIndex(content, 0)).toBe(0)
      expect(getContentIndexFromDomIndex(content, 1)).toBe(1)
      expect(getContentIndexFromDomIndex(content, 2)).toBe(2)
    })
  })

  describe("a multi-item prose block preceding another block", () => {
    beforeEach(() => {
      // prose block -> 3 sibling <p> elements, then the image block -> 1 <div>
      container = renderContainer(["p", "p", "p", "div"])
    })

    const content = [
      {
        type: "prose",
        content: [
          { type: "paragraph" },
          { type: "paragraph" },
          { type: "paragraph" },
        ],
      },
      { type: "image" },
    ] as unknown as IsomerSchema["content"]

    it("resolves the prose block to its first DOM child, not a shifted one", () => {
      expect(getBlockElement(document, content, 0)).toBe(container?.children[0])
    })

    it("resolves the block after prose to the DOM child after all of prose's items", () => {
      expect(getBlockElement(document, content, 1)).toBe(container?.children[3])
    })

    it("maps every DOM child belonging to prose back to the prose content index", () => {
      expect(getContentIndexFromDomIndex(content, 0)).toBe(0)
      expect(getContentIndexFromDomIndex(content, 1)).toBe(0)
      expect(getContentIndexFromDomIndex(content, 2)).toBe(0)
    })

    it("maps the DOM child after prose back to the following content index", () => {
      expect(getContentIndexFromDomIndex(content, 3)).toBe(1)
    })
  })

  describe("a hidden childrenpages block", () => {
    beforeEach(() => {
      container = renderContainer(["div"])
    })

    it("is skipped entirely and never reaches the DOM", () => {
      const content = [
        { type: "childrenpages", isHidden: true },
        { type: "image" },
      ] as unknown as IsomerSchema["content"]

      expect(getBlockElement(document, content, 0)).toBeUndefined()
      expect(getBlockElement(document, content, 1)).toBe(container?.children[0])
      expect(getContentIndexFromDomIndex(content, 0)).toBe(1)
    })
  })
})
