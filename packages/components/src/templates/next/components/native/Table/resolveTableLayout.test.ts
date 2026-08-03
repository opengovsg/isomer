import { describe, expect, it } from "vitest"

import { resolveTableLayout } from "./resolveTableLayout"

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
      row(cell(4294967296)),
      row(cell(-5)),
      row(cell("1e9" as never)),
    ]

    // Act / Assert
    for (const rows of hostileCases) {
      expect(() => resolveTableLayout(rows)).not.toThrow()
      expect(resolveTableLayout(rows)).toEqual({ kind: "auto" })
    }
  })
})
