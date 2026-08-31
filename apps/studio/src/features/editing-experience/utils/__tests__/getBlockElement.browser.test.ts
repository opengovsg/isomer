import type { IsomerSchema } from "@opengovsg/isomer-components"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { CONTENT_BLOCK_INDEX_ATTR } from "../../constants"
import { getBlockElement, getContentIndexFromElement } from "../getBlockElement"

const renderContainer = (
  blocks: { contentIndex: number; tag?: string }[],
): HTMLElement => {
  const container = document.createElement("div")
  container.setAttribute("data-isomer-content-blocks", "")

  blocks.forEach(({ contentIndex, tag = "div" }) => {
    const el = document.createElement(tag)
    el.setAttribute(CONTENT_BLOCK_INDEX_ATTR, String(contentIndex))
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
      expect(getBlockElement(document, 0)).toBe(container?.children[0])
      expect(getBlockElement(document, 1)).toBe(container?.children[1])
      expect(getBlockElement(document, 2)).toBe(container?.children[2])
    })

    it("maps a stamped DOM node back to the same content index", () => {
      expect(getContentIndexFromElement(container!.children[0]!)).toBe(0)
      expect(getContentIndexFromElement(container!.children[1]!)).toBe(1)
      expect(getContentIndexFromElement(container!.children[2]!)).toBe(2)
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
      expect(getBlockElement(document, 0)).toBe(container?.children[0])
    })

    it("resolves the block after prose to its stamped DOM node", () => {
      expect(getBlockElement(document, 1)).toBe(container?.children[3])
    })

    it("maps every DOM node belonging to prose back to the prose content index", () => {
      expect(getContentIndexFromElement(container!.children[0]!)).toBe(0)
      expect(getContentIndexFromElement(container!.children[1]!)).toBe(0)
      expect(getContentIndexFromElement(container!.children[2]!)).toBe(0)
    })

    it("maps the DOM node after prose back to the following content index", () => {
      expect(getContentIndexFromElement(container!.children[3]!)).toBe(1)
    })
  })

  describe("a block that renders no DOM nodes", () => {
    beforeEach(() => {
      container = renderContainer([{ contentIndex: 1 }])
    })

    it("returns undefined for a content index with no stamped node", () => {
      const content = [
        { type: "childrenpages", isHidden: false },
        { type: "image" },
      ] as unknown as IsomerSchema["content"]

      expect(content).toHaveLength(2)
      expect(getBlockElement(document, 0)).toBeUndefined()
      expect(getBlockElement(document, 1)).toBe(container?.children[0])
    })
  })
})
