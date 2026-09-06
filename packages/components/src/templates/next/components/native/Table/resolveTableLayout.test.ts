import type { TableProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { resolveTableLayout } from "./resolveTableLayout"

type TableRows = TableProps["content"]

describe("resolveTableLayout", () => {
  it("returns auto layout for a plain rectangular table", () => {
    // Arrange
    const rows = [
      {
        content: [
          {
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableHeader" as const,
          },
          {
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableHeader" as const,
          },
        ],
        type: "tableRow" as const,
      },
    ]

    // Act / Assert
    expect(resolveTableLayout(rows)).toEqual({ kind: "auto" })
  })

  it("returns fixed equal-width tracks for staggered merges with a phantom column", () => {
    // Arrange
    const rows = [
      {
        content: [
          {
            attrs: { colspan: 1, rowspan: 1 },
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableHeader" as const,
          },
          {
            attrs: { colspan: 2, rowspan: 1 },
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableHeader" as const,
          },
        ],
        type: "tableRow" as const,
      },
      {
        content: [
          {
            attrs: { colspan: 2, rowspan: 2 },
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
          {
            attrs: { colspan: 1, rowspan: 1 },
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
        ],
        type: "tableRow" as const,
      },
      {
        content: [
          {
            attrs: { colspan: 1, rowspan: 1 },
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
        ],
        type: "tableRow" as const,
      },
    ]

    // Act / Assert
    expect(resolveTableLayout(rows)).toEqual({
      columnWidths: [`${100 / 3}%`, `${100 / 3}%`, `${100 / 3}%`],
      kind: "fixed",
    })
  })

  type TableSpanAttribute = string | number | null | undefined

  it("returns auto layout for hostile colspan values without throwing", () => {
    // Arrange
    const cell = (colspan: TableSpanAttribute) => ({
      attrs: colspan === undefined ? undefined : { colspan },
      content: [
        {
          content: [{ text: "", type: "text" as const }],
          type: "paragraph" as const,
        },
      ],
      type: "tableCell" as const,
    })
    const row = (...cells: ReturnType<typeof cell>[]) => ({
      content: cells,
      type: "tableRow" as const,
    })
    const toHostileTableRows = (
      hostileRow: ReturnType<typeof row>,
    ): TableRows => 
      // SAFETY: Test passes TipTap rows with hostile colspan attrs through resolveTableLayout.
      [hostileRow] as TableRows
    
    const hostileCases = [
      { kind: "fixed", rows: toHostileTableRows(row(cell(4_294_967_296))) },
      { kind: "auto", rows: toHostileTableRows(row(cell(-5))) },
      { kind: "auto", rows: toHostileTableRows(row(cell("1e9"))) },
    ]

    for (const { rows, kind } of hostileCases) {
      // Act
      const layout = resolveTableLayout(rows)

      // Assert
      expect(layout.kind).toBe(kind)
    }
  })
})
