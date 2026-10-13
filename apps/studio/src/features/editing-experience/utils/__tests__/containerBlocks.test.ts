import { describe, expect, it } from "vitest"

import type { AccordionBlock, ColumnBlock } from "../containerBlocks"
import {
  isLegacyAccordion,
  normaliseLegacyAccordion,
  resizeColumns,
} from "../containerBlocks"

const prose: NonNullable<AccordionBlock["details"]> = {
  type: "prose",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello" }],
    },
  ],
}

describe("normaliseLegacyAccordion", () => {
  it("moves a legacy prose body into the content list", () => {
    // Arrange
    const block: AccordionBlock = {
      type: "accordion",
      summary: "Title",
      details: prose,
    }

    // Act
    const result = normaliseLegacyAccordion(block)

    // Assert
    expect(isLegacyAccordion(block)).toBe(true)
    expect(result).toEqual({
      type: "accordion",
      summary: "Title",
      content: [prose],
    })
  })

  it("turns an empty legacy body into an empty content list", () => {
    // Arrange
    const block: AccordionBlock = {
      type: "accordion",
      summary: "Title",
      details: { type: "prose", content: [] },
    }

    // Act
    const result = normaliseLegacyAccordion(block)

    // Assert
    expect(result).toEqual({ type: "accordion", summary: "Title", content: [] })
  })

  it("leaves an accordion that already has content untouched", () => {
    // Arrange
    const block: AccordionBlock = {
      type: "accordion",
      summary: "Title",
      content: [prose],
    }

    // Act + Assert
    expect(isLegacyAccordion(block)).toBe(false)
    expect(normaliseLegacyAccordion(block)).toBe(block)
  })
})

describe("resizeColumns", () => {
  it("adds an empty slot when switching to three columns", () => {
    // Arrange
    const columns: ColumnBlock["columns"] = [[prose], []]

    // Act + Assert
    expect(resizeColumns(columns, "threeEqual")).toEqual([[prose], [], []])
  })

  it("drops the trailing slot when switching back to two columns", () => {
    // Arrange
    const columns: ColumnBlock["columns"] = [[prose], [], [prose]]

    // Act + Assert
    expect(resizeColumns(columns, "oneThirdTwoThirds")).toEqual([[prose], []])
  })
})
