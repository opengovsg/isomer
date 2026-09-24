import type { TableProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { resolveTableLayout } from "./resolveTableLayout"

type TableRows = TableProps["content"]

describe("resolveTableLayout", () => {
  it("returns auto layout for a plain rectangular table", () => {
    // Arrange
    const rows = [
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableHeader" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableHeader" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
        ],
      },
    ]

    // Act / Assert
    expect(resolveTableLayout(rows)).toEqual({ kind: "auto" })
  })

  it("returns fixed equal-width tracks for staggered merges with a phantom column", () => {
    // Arrange
    const rows = [
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableHeader" as const,
            attrs: { colspan: 1, rowspan: 1 },
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableHeader" as const,
            attrs: { colspan: 2, rowspan: 1 },
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
        ],
      },
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableCell" as const,
            attrs: { colspan: 2, rowspan: 2 },
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableCell" as const,
            attrs: { colspan: 1, rowspan: 1 },
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
        ],
      },
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableCell" as const,
            attrs: { colspan: 1, rowspan: 1 },
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
        ],
      },
    ]

    // Act / Assert
    expect(resolveTableLayout(rows)).toEqual({
      kind: "fixed",
      columnWidths: [`${100 / 3}%`, `${100 / 3}%`, `${100 / 3}%`],
    })
  })

  it("returns auto layout for hostile colspan values without throwing", () => {
    // Arrange
    const cell = (colspan: unknown) => ({
      type: "tableCell" as const,
      attrs: colspan !== undefined ? { colspan } : undefined,
      content: [
        {
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: "" }],
        },
      ],
    })
    const row = (...cells: ReturnType<typeof cell>[]) => ({
      type: "tableRow" as const,
      content: cells,
    })
    const hostileCases = [
      { rows: [row(cell(4294967296))] as unknown as TableRows, kind: "fixed" },
      { rows: [row(cell(-5))] as unknown as TableRows, kind: "auto" },
      { rows: [row(cell("1e9"))] as unknown as TableRows, kind: "auto" },
    ]

    for (const { rows, kind } of hostileCases) {
      // Act
      const layout = resolveTableLayout(rows)

      // Assert
      expect(layout.kind).toBe(kind)
    }
  })
})
