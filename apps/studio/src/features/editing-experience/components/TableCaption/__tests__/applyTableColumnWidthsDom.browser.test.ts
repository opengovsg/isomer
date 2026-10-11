import { describe, expect, it } from "vitest"

import { applyTableColumnWidthsDom } from "../applyTableColumnWidthsDom"

describe("applyTableColumnWidthsDom", () => {
  it("writes a colgroup and table width for author widths", () => {
    // Arrange
    const table = document.createElement("table")
    table.innerHTML = "<tbody><tr><td>A</td><td>B</td></tr></tbody>"

    // Act
    applyTableColumnWidthsDom(table, [100, 200])

    // Assert
    const cols = table.querySelectorAll(":scope > colgroup > col")
    expect(cols).toHaveLength(2)
    expect((cols[0] as HTMLElement).style.width).toBe("100px")
    expect((cols[1] as HTMLElement).style.width).toBe("200px")
    expect(table.style.width).toBe("300px")
    expect(table.dataset.tableLayout).toBeUndefined()
  })

  it("marks an unsized table for automatic layout and drops the colgroup", () => {
    // Arrange
    const table = document.createElement("table")
    applyTableColumnWidthsDom(table, [100, 200])

    // Act
    applyTableColumnWidthsDom(table, null, {
      hasPhantomColumns: false,
      columnCount: 2,
    })

    // Assert
    expect(table.querySelector(":scope > colgroup")).toBeNull()
    expect(table.style.width).toBe("")
    expect(table.dataset.tableLayout).toBe("auto")
  })

  it("uses equal percentage tracks when an unsized table has a phantom column", () => {
    // Arrange
    const table = document.createElement("table")
    table.innerHTML = "<tbody><tr><td>A</td><td>B</td></tr></tbody>"

    // Act
    applyTableColumnWidthsDom(table, null, {
      hasPhantomColumns: true,
      columnCount: 3,
    })

    // Assert
    const cols = table.querySelectorAll(":scope > colgroup > col")
    expect(cols).toHaveLength(3)
    expect(Number.parseFloat((cols[0] as HTMLElement).style.width)).toBeCloseTo(
      100 / 3,
      4,
    )
    expect(table.style.width).toBe("")
    expect(table.dataset.tableLayout).toBe("even")
  })
})
