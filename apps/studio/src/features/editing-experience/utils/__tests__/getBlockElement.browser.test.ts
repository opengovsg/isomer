import type { IsomerSchema } from "@opengovsg/isomer-components"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { CONTENT_BLOCK_INDEX_ATTR } from "../../constants"
import {
  getBlockElement,
  getBlockElements,
  getBlockHighlightRect,
  getContentIndexFromElement,
} from "../getBlockElement"

const renderContainer = (
  blocks: { contentIndex: number; tag?: string }[],
): HTMLElement => {
  const container = document.createElement("div")
  container.setAttribute("data-isomer-content-blocks", "")

  blocks.forEach(({ contentIndex, tag = "div" }) => {
    const el = document.createElement(tag)
    el.setAttribute(CONTENT_BLOCK_INDEX_ATTR, String(contentIndex))
    el.style.width = "200px"
    el.style.height = "40px"
    container.appendChild(el)
  })

  document.body.appendChild(container)
  return container
}

describe("getBlockElement / getContentIndexFromElement", () => {
  let container: HTMLElement | null = null

  afterEach(() => {
    container?.remove()
    container = null
  })

  describe("blocks that render as a single DOM node", () => {
    beforeEach(() => {
      container = renderContainer([
        { contentIndex: 0 },
        { contentIndex: 1 },
        { contentIndex: 2 },
      ])
    })

    it("maps content index to the stamped DOM node", () => {
      // Arrange / Act / Assert
      expect(getBlockElement(document, 0)).toBe(container?.children[0])
      expect(getBlockElement(document, 1)).toBe(container?.children[1])
      expect(getBlockElement(document, 2)).toBe(container?.children[2])
    })

    it("maps a stamped DOM node back to the same content index", () => {
      // Arrange / Act / Assert
      expect(getContentIndexFromElement(container!.children[0]!)).toBe(0)
      expect(getContentIndexFromElement(container!.children[1]!)).toBe(1)
      expect(getContentIndexFromElement(container!.children[2]!)).toBe(2)
    })

    it("highlights the stamped DOM node bounds", () => {
      // Arrange
      const el = container!.children[1] as HTMLElement
      const bounds = el.getBoundingClientRect()

      // Act
      const rect = getBlockHighlightRect(document, 1)

      // Assert
      expect(rect).toEqual({
        top: bounds.top + window.scrollY,
        left: bounds.left + window.scrollX,
        width: bounds.width,
        height: bounds.height,
      })
    })
  })

  describe("a multi-item prose block preceding another block", () => {
    beforeEach(() => {
      container = renderContainer([
        { contentIndex: 0, tag: "p" },
        { contentIndex: 0, tag: "p" },
        { contentIndex: 0, tag: "p" },
        { contentIndex: 1, tag: "div" },
      ])
    })

    it("resolves the prose block to its first stamped DOM node", () => {
      // Arrange / Act / Assert
      expect(getBlockElement(document, 0)).toBe(container?.children[0])
    })

    it("returns every stamped DOM node belonging to the prose block", () => {
      // Arrange / Act
      const elements = getBlockElements(document, 0)

      // Assert
      expect(elements).toEqual([
        container?.children[0],
        container?.children[1],
        container?.children[2],
      ])
    })

    it("resolves the block after prose to its stamped DOM node", () => {
      // Arrange / Act / Assert
      expect(getBlockElement(document, 1)).toBe(container?.children[3])
    })

    it("maps every DOM node belonging to prose back to the prose content index", () => {
      // Arrange / Act / Assert
      expect(getContentIndexFromElement(container!.children[0]!)).toBe(0)
      expect(getContentIndexFromElement(container!.children[1]!)).toBe(0)
      expect(getContentIndexFromElement(container!.children[2]!)).toBe(0)
    })

    it("maps the DOM node after prose back to the following content index", () => {
      // Arrange / Act / Assert
      expect(getContentIndexFromElement(container!.children[3]!)).toBe(1)
    })

    it("highlights the union of every stamped node, not only the first", () => {
      // Arrange
      const first = container!.children[0]!.getBoundingClientRect()
      const last = container!.children[2]!.getBoundingClientRect()

      // Act
      const rect = getBlockHighlightRect(document, 0)

      // Assert
      expect(rect).toEqual({
        top: first.top + window.scrollY,
        left: Math.min(first.left, last.left) + window.scrollX,
        width:
          Math.max(first.right, last.right) - Math.min(first.left, last.left),
        height: last.bottom - first.top,
      })
      expect(rect!.height).toBeGreaterThan(first.height)
    })
  })

  describe("a block that renders no DOM nodes", () => {
    beforeEach(() => {
      container = renderContainer([{ contentIndex: 1 }])
    })

    it("returns undefined for a content index with no stamped node", () => {
      // Arrange
      const content = [
        { type: "childrenpages", isHidden: false },
        { type: "image" },
      ] as unknown as IsomerSchema["content"]

      // Act / Assert
      expect(content).toHaveLength(2)
      expect(getBlockElement(document, 0)).toBeUndefined()
      expect(getBlockHighlightRect(document, 0)).toBeUndefined()
      expect(getBlockElement(document, 1)).toBe(container?.children[0])
    })
  })
})
