import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Table } from "../Table"
import { denseThreeColumnTable } from "./fixtures/denseThreeColumnTable"
import { staggeredPhantomMerge } from "./fixtures/staggeredPhantomMerge"
import {
  getCellWidths,
  getTableWidth,
  TABLE_CONTAINER_WIDTH_PX,
} from "./layoutTestUtils"

const renderTable = (props: {
  attrs: (typeof denseThreeColumnTable)["attrs"]
  content: (typeof denseThreeColumnTable)["content"]
}) => {
  const view = render(
    <div style={{ width: TABLE_CONTAINER_WIDTH_PX }}>
      <Table type="table" site={generateSiteConfig()} {...props} />
    </div>,
  )

  const table = view.container.querySelector("table")
  if (!table) {
    throw new Error("Expected a table element")
  }

  return { ...view, table }
}

describe("Table layout", () => {
  it("keeps content-based widths for a dense 3-column table", () => {
    // Arrange / Act
    const { table } = renderTable(denseThreeColumnTable)

    // Assert
    expect(table.className).not.toContain("table-fixed")
    expect(table.querySelector("colgroup")).toBeNull()

    const [yearWidth = 0, descriptionWidth = 0] = getCellWidths(table, 0)
    expect(yearWidth).toBeGreaterThan(0)
    expect(descriptionWidth).toBeGreaterThan(yearWidth * 2)
  })

  it("renders equal logical tracks for staggered merges with a phantom column", () => {
    // Arrange / Act
    const { table } = renderTable(staggeredPhantomMerge)

    // Assert
    expect(table.className).toContain("table-fixed")
    expect(table.querySelectorAll("col")).toHaveLength(3)

    const tableWidth = getTableWidth(table)
    const [h1Width = 0, h2h3Width = 0] = getCellWidths(table, 0)
    expect(h1Width).toBeGreaterThan(0)
    expect(h2h3Width).toBeGreaterThan(0)

    expect(h1Width / tableWidth).toBeCloseTo(1 / 3, 1)
    expect(h2h3Width / tableWidth).toBeCloseTo(2 / 3, 1)
  })
})
