import type { StockFeatures } from "@tanstack/react-table"
import { HStack, Icon, LinkOverlay, Text } from "@chakra-ui/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import {
  createColumnHelper,
  stockFeatures,
  useTable,
} from "@tanstack/react-table"
import { cleanup, render, screen } from "@testing-library/react"
import { BiFile } from "react-icons/bi"
import { afterEach, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"
import { theme } from "~/theme"

import { Datatable } from "./Datatable"

interface TestRowData {
  title: string
  permalink: string
}

const columnsHelper = createColumnHelper<StockFeatures, TestRowData>()
const columns = columnsHelper.columns([
  columnsHelper.accessor("title", {
    header: "Title",
    cell: ({ row }) => (
      <HStack align="center" spacing="0.625rem">
        <Icon
          as={BiFile}
          fontSize="1.25rem"
          color="base.content.strong"
          pointerEvents="none"
        />
        <LinkOverlay
          href="/test-page"
          sx={{ position: "static", pointerEvents: "auto" }}
        >
          {row.original.title}
        </LinkOverlay>
        <Text pointerEvents="none">{row.original.permalink}</Text>
      </HStack>
    ),
  }),
])

const LinkedRowTable = ({
  data = [{ title: "Test page", permalink: "/test-page" }],
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

  it("routes row clicks through the link overlay outside the title text", async () => {
    render(<LinkedRowTable />)

    const link = screen.getByRole("link", { name: "Test page" })
    const row = link.closest("tr")

    expect(row).not.toBeNull()
    if (!row) throw new Error("Expected link to be inside a table row")

    let linkClicked = false
    link.addEventListener("click", (event) => {
      linkClicked = true
      event.preventDefault()
    })

    const rowBounds = row.getBoundingClientRect()
    await userEvent.click(row, {
      position: { x: rowBounds.width - 8, y: rowBounds.height / 2 },
    })

    expect(linkClicked).toBe(true)
  })

  it("keeps the row styles that the Table theme applies to Tr", () => {
    // Arrange / Act
    render(
      <LinkedRowTable
        data={[
          { title: "First", permalink: "/first" },
          { title: "Last", permalink: "/last" },
        ]}
      />,
    )

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
