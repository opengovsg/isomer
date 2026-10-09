import type { JSONContent } from "@tiptap/react"
import { ThemeProvider } from "@opengovsg/design-system-react"
import { render, waitFor } from "@testing-library/react"
import { EditorContent } from "@tiptap/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"
import { theme } from "~/theme"
import "~/styles/tiptap.scss"

const wideTable: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Wide", columnWidths: [400, 400] },
      content: [
        {
          type: "tableRow",
          content: ["Alpha", "Beta"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
      ],
    },
  ],
}

const narrowTable: JSONContent = {
  type: "prose",
  content: [
    {
      type: "table",
      attrs: { caption: "Narrow" },
      content: [
        {
          type: "tableRow",
          content: ["A", "B"].map((text) => ({
            type: "tableHeader",
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
      ],
    },
  ],
}

const Harness = ({
  content,
  width,
}: {
  content: JSONContent
  width: number
}) => {
  const [data, setData] = useState<JSONContent | undefined>(content)
  const editor = useTextEditor({ data, handleChange: setData })
  return (
    <div style={{ width, overflowX: "hidden", background: "white" }}>
      <EditorContent editor={editor} />
    </div>
  )
}

const scrollportOf = (container: HTMLElement) => {
  const scrollport = container.querySelector("[data-table-scrollport]")
  if (!(scrollport instanceof HTMLElement)) {
    throw new Error("table scrollport not found")
  }
  return scrollport
}

const maskImageOf = (element: HTMLElement) => {
  const style = getComputedStyle(element)
  return style.maskImage || style.webkitMaskImage
}

describe("table scroll fade", () => {
  it("fades the trailing edge when a wide table overflows the editor", async () => {
    // Arrange
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Harness content={wideTable} width={320} />
      </ThemeProvider>,
    )

    // Act
    const scrollport = await waitFor(() => scrollportOf(container))

    // Assert
    await waitFor(() => {
      expect(scrollport.scrollWidth).toBeGreaterThan(scrollport.clientWidth)
      expect(maskImageOf(scrollport)).toContain("linear-gradient")
    })
  })

  it("fades both edges when columns are hidden on either side", async () => {
    // Arrange
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Harness content={wideTable} width={320} />
      </ThemeProvider>,
    )
    const scrollport = await waitFor(() => scrollportOf(container))
    await waitFor(() => {
      expect(scrollport.scrollWidth).toBeGreaterThan(scrollport.clientWidth)
    })

    // Act
    scrollport.scrollLeft = 40

    // Assert
    await waitFor(() => {
      expect(maskImageOf(scrollport)).toContain("linear-gradient")
    })
  })

  it("fades the leading edge once the table is scrolled to the end", async () => {
    // Arrange
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Harness content={wideTable} width={320} />
      </ThemeProvider>,
    )
    const scrollport = await waitFor(() => scrollportOf(container))
    await waitFor(() => {
      expect(scrollport.scrollWidth).toBeGreaterThan(scrollport.clientWidth)
    })

    // Act
    scrollport.scrollLeft = scrollport.scrollWidth

    // Assert
    await waitFor(() => {
      expect(maskImageOf(scrollport)).toContain("linear-gradient")
    })
  })

  it("shows no fade when the table fits in the editor", async () => {
    // Arrange / Act
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Harness content={narrowTable} width={640} />
      </ThemeProvider>,
    )
    const scrollport = await waitFor(() => scrollportOf(container))

    // Assert
    // The last column-resize handle sits 4px past the table edge, so a table
    // that fits can still report a few pixels of overflow. That is not enough
    // to scroll, and it must not paint a fade.
    await waitFor(() => {
      expect(
        scrollport.scrollWidth - scrollport.clientWidth,
      ).toBeLessThanOrEqual(8)
      expect(maskImageOf(scrollport)).toBe("none")
    })
  })
})
