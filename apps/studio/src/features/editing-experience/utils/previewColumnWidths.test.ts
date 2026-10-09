import { describe, expect, it } from "vitest"

import { tablesBeforeBlock } from "./previewColumnWidths"

const table = { type: "table" }
const paragraph = { type: "paragraph" }

const pageWithTables = () => [
  { type: "prose", content: [paragraph, table, table] },
  {
    type: "callout",
    content: { type: "prose", content: [paragraph, table] },
  },
  {
    type: "accordion",
    details: { type: "prose", content: [table, paragraph] },
  },
  {
    type: "contentpic",
    content: { type: "prose", content: [table] },
  },
  { type: "prose", content: [table, table] },
]

describe("tablesBeforeBlock", () => {
  it("skips tables in the block being edited", () => {
    // Arrange
    const content = pageWithTables()

    // Act
    const count = tablesBeforeBlock(content, 0)

    // Assert
    expect(count).toBe(0)
  })

  it("counts tables in an earlier prose block", () => {
    // Arrange
    const content = pageWithTables()

    // Act
    const count = tablesBeforeBlock(content, 1)

    // Assert
    expect(count).toBe(2)
  })

  it("counts a table nested in an earlier callout", () => {
    // Arrange
    const content = pageWithTables()

    // Act
    const count = tablesBeforeBlock(content, 2)

    // Assert
    expect(count).toBe(3)
  })

  it("counts a table nested in earlier accordion details", () => {
    // Arrange
    const content = pageWithTables()

    // Act
    const count = tablesBeforeBlock(content, 3)

    // Assert
    expect(count).toBe(4)
  })

  it("counts a table nested in an earlier content picture", () => {
    // Arrange
    const content = pageWithTables()

    // Act
    const count = tablesBeforeBlock(content, 4)

    // Assert
    expect(count).toBe(5)
  })

  it("counts every preceding table when the index is past the last block", () => {
    // Arrange
    const content = pageWithTables()

    // Act
    const count = tablesBeforeBlock(content, 5)

    // Assert
    expect(count).toBe(7)
  })
})
