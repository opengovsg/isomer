import { describe, expect, it } from "vitest"

import { getTableColumnCount } from "./getTableColumnCount"

describe("getTableColumnCount", () => {
  it("returns 0 for an empty table", () => {
    // Arrange
    const rows: [] = []

    // Act
    const count = getTableColumnCount(rows)

    // Assert
    expect(count).toBe(0)
  })

  it("counts columns in a plain rectangular table", () => {
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
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableCell" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableCell" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableCell" as const,
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
    expect(getTableColumnCount(rows)).toBe(3)
  })

  it("keeps 3 columns for staggered merges with a phantom middle column", () => {
    // Arrange — row1 merges cols 2–3; row2 merges cols 1–2 (rowspan 2); row3 only has col 3
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
    expect(getTableColumnCount(rows)).toBe(3)
  })

  it("counts colspan on a single header cell spanning the full width", () => {
    // Arrange
    const rows = [
      {
        type: "tableRow" as const,
        content: [
          {
            type: "tableHeader" as const,
            attrs: { colspan: 4 },
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
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableCell" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableCell" as const,
            content: [
              {
                type: "paragraph" as const,
                content: [{ type: "text" as const, text: "" }],
              },
            ],
          },
          {
            type: "tableCell" as const,
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
    expect(getTableColumnCount(rows)).toBe(4)
  })

  it("defaults missing colspan/rowspan to 1", () => {
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
    expect(getTableColumnCount(rows)).toBe(2)
  })

  it("counts columns for many rows with a rowspan without scanning every earlier row", () => {
    // Arrange
    const paragraph = {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "" }],
    }
    const rows = Array.from({ length: 200 }, (_, rowIndex) => ({
      type: "tableRow" as const,
      content:
        rowIndex === 0
          ? [
              {
                type: "tableCell" as const,
                attrs: { colspan: 1, rowspan: 2 },
                content: [paragraph],
              },
              {
                type: "tableCell" as const,
                content: [paragraph],
              },
            ]
          : rowIndex === 1
            ? [
                {
                  type: "tableCell" as const,
                  content: [paragraph],
                },
              ]
            : [
                {
                  type: "tableCell" as const,
                  content: [paragraph],
                },
                {
                  type: "tableCell" as const,
                  content: [paragraph],
                },
              ],
    }))

    // Act / Assert
    expect(getTableColumnCount(rows)).toBe(2)
  })

  it("resolves a large table with a rowspan without quadratic/cubic blowup", () => {
    // Arrange — 1000 rows x 1000 cells, with row 0's first cell spanning into
    // row 1 (rowspan: 2). A history-rescanning implementation must, for every
    // one of the ~1000 later rows, re-walk up to 1000 earlier rows of ~1000
    // cells each to find which still cover it — ~10^9 operations, which took
    // over 15s in manual testing. A sweep that tracks active rowspan credit
    // incrementally does the same work in a few milliseconds.
    const paragraph = {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "" }],
    }
    const rowCount = 1000
    const cellsPerRow = 1000
    const rows = Array.from({ length: rowCount }, (_, rowIndex) => ({
      type: "tableRow" as const,
      content: Array.from({ length: cellsPerRow }, (_, cellIndex) => ({
        type: "tableCell" as const,
        attrs:
          rowIndex === 0 && cellIndex === 0
            ? { colspan: 1, rowspan: 2 }
            : { colspan: 1, rowspan: 1 },
        content: [paragraph],
      })),
    }))

    // Act
    const start = performance.now()
    const count = getTableColumnCount(rows)
    const elapsedMs = performance.now() - start

    // Assert
    expect(count).toBe(cellsPerRow + 1)
    expect(elapsedMs).toBeLessThan(1000)
  })
})
