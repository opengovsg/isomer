import type { JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, screen, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"
import "~/styles/tiptap.scss"

const prose = (table: JSONContent): JSONContent => ({
  type: "prose",
  content: [table],
})

const row = (cells: JSONContent[]): JSONContent => ({
  type: "tableRow",
  content: cells,
})

const header = (text: string): JSONContent => ({
  type: "tableHeader",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
})

const unsizedTable: JSONContent = prose({
  type: "table",
  attrs: { caption: "Unsized" },
  content: [
    row([
      header("A"),
      header(
        "This cell has a much longer sentence so automatic layout gives it more width",
      ),
    ]),
  ],
})

const sizedTable: JSONContent = prose({
  type: "table",
  attrs: { caption: "Sized", columnWidths: [200, 220] },
  content: [row([header("A"), header("B")])],
})

const Harness = ({ content }: { content: JSONContent }) => {
  const [data, setData] = useState<JSONContent | undefined>(content)
  const editor = useTextEditor({
    data,
    handleChange: setData,
  })
  return (
    <div style={{ width: 480 }}>
      <EditorContent editor={editor} />
    </div>
  )
}

const editorTable = () => {
  const table = document.querySelector("[data-column-resize-root] table")
  if (!(table instanceof HTMLTableElement)) {
    throw new Error("missing editor table")
  }
  return table
}

describe("unsized editor table layout", () => {
  it("uses automatic layout and parks the resize handle on the real column edge", async () => {
    // Arrange
    render(
      <ThemeProvider theme={theme}>
        <Harness content={unsizedTable} />
      </ThemeProvider>,
    )

    // Act
    const handle = await screen.findByRole("separator", {
      name: "Resize column 1",
    })

    // Assert
    await waitFor(() => {
      const table = editorTable()
      const cell = table.rows[0]?.cells[0]
      expect(cell).toBeTruthy()
      expect(getComputedStyle(table).tableLayout).toBe("auto")
      expect(cell && getComputedStyle(cell).maxWidth).toBe("160px")
      const edge = cell?.getBoundingClientRect().right ?? 0
      const handleCentre = handle.getBoundingClientRect().left + 4
      expect(Math.abs(handleCentre - edge)).toBeLessThan(2)
    })
  })

  it("keeps fixed pixel tracks when column widths are stored", async () => {
    // Arrange / Act
    render(
      <ThemeProvider theme={theme}>
        <Harness content={sizedTable} />
      </ThemeProvider>,
    )

    // Assert
    await waitFor(() => {
      const table = editorTable()
      const cell = table.rows[0]?.cells[0]
      expect(getComputedStyle(table).tableLayout).toBe("fixed")
      expect(
        table
          .closest("[data-column-resize-root]")
          ?.getAttribute("data-table-layout"),
      ).toBeNull()
      expect(cell && getComputedStyle(cell).maxWidth).toBe("none")
    })
  })
})
