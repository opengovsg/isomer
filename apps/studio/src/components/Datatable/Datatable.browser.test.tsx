import type { StockFeatures } from "@tanstack/react-table"
import { LinkOverlay } from "@chakra-ui/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  createColumnHelper,
  stockFeatures,
  useTable,
} from "@tanstack/react-table"
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { theme } from "~/theme"

import { Datatable } from "./Datatable"

interface TestRowData {
  title: string
}

const columnsHelper = createColumnHelper<StockFeatures, TestRowData>()
const columns = columnsHelper.columns([
  columnsHelper.accessor("title", {
    header: "Title",
    cell: ({ getValue }) => (
      <LinkOverlay href="/test-page" sx={{ position: "static" }}>
        {getValue()}
      </LinkOverlay>
    ),
  }),
])

const LinkedRowTable = ({
  data = [{ title: "Test page" }],
}: {
  data?: TestRowData[]
}) => {
  const instance = useTable({
    features: stockFeatures,
    columns,
    data,
  })

  return (
    <ThemeProvider theme={theme}>
      <Datatable isRowLink instance={instance} />
    </ThemeProvider>
  )
}

describe("Datatable linked rows", () => {
  afterEach(cleanup)

  it("uses a native link overlay while preserving valid table markup", () => {
    render(<LinkedRowTable />)

    const link = screen.getByRole("link", { name: "Test page" })
    const row = link.closest("tr")

    expect(row).not.toBeNull()
    if (!row) throw new Error("Expected link to be inside a table row")

    expect(row.parentElement?.tagName).toBe("TBODY")
    expect(link.getAttribute("href")).toBe("/test-page")
    expect(getComputedStyle(row).position).toBe("relative")
    expect(getComputedStyle(row).cursor).toBe("pointer")
    expect(getComputedStyle(link).position).toBe("static")

    const overlayStyles = getComputedStyle(link, "::before")
    const rowBounds = row.getBoundingClientRect()
    expect(overlayStyles.position).toBe("absolute")
    expect(Number.parseFloat(overlayStyles.width)).toBeCloseTo(
      rowBounds.width,
      0,
    )
    expect(
      Math.abs(Number.parseFloat(overlayStyles.height) - rowBounds.height),
    ).toBeLessThanOrEqual(1)
  })

  it("keeps the row styles that the Table theme applies to Tr", () => {
    // Arrange / Act
    render(<LinkedRowTable data={[{ title: "First" }, { title: "Last" }]} />)

    const [, ...bodyRows] = screen.getAllByRole("row")
    const [firstRow, lastRow] = bodyRows.map((row) => getComputedStyle(row))

    // Assert
    // The last row drops its divider so it doesn't double up on the
    // container border.
    expect(firstRow?.borderBottomWidth).toBe("1px")
    expect(lastRow?.borderBottomWidth).toBe("0px")
    // body-2 typography.
    expect(firstRow?.fontSize).toBe("14px")
    expect(firstRow?.lineHeight).toBe("20px")
  })
})
