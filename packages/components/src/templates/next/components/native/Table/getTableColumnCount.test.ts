import { describe, expect, it } from "vitest"

import { getTableColumnCount } from "./getTableColumnCount"

describe(getTableColumnCount, () => {
  it("returns 0 for an empty table", () => {
    // Arrange
    const rows: [] = []

    // Act / Assert
    expect(getTableColumnCount(rows)).toBe(0)
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

  it("resolves a large table with a rowspan without quadratic blowup", () => {
    // Arrange: 1000×1000 cells; row 0 cell 0 has rowspan 2. Naive rescans are ~10^9 ops.
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
