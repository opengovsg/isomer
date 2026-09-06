import { describe, expect, it } from "vitest"

import { getTableColumnCount } from "./getTableColumnCount"

describe("getTableColumnCount", () => {
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
      {
        content: [
          {
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
          {
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
          {
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
    expect(getTableColumnCount(rows)).toBe(3)
  })

  it("keeps 3 columns for staggered merges with a phantom middle column", () => {
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
    expect(getTableColumnCount(rows)).toBe(3)
  })

  it("counts colspan on a single header cell spanning the full width", () => {
    // Arrange
    const rows = [
      {
        content: [
          {
            attrs: { colspan: 4 },
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
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
          {
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
          {
            content: [
              {
                content: [{ text: "", type: "text" as const }],
                type: "paragraph" as const,
              },
            ],
            type: "tableCell" as const,
          },
          {
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
    expect(getTableColumnCount(rows)).toBe(4)
  })

  it("defaults missing colspan/rowspan to 1", () => {
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
    expect(getTableColumnCount(rows)).toBe(2)
  })

  it("counts columns for many rows with a rowspan without scanning every earlier row", () => {
    // Arrange
    const paragraph = {
      content: [{ text: "", type: "text" as const }],
      type: "paragraph" as const,
    }
    const getRowContent = (rowIndex: number) => {
      if (rowIndex === 0) {
        return [
          {
            attrs: { colspan: 1, rowspan: 2 },
            content: [paragraph],
            type: "tableCell" as const,
          },
          {
            content: [paragraph],
            type: "tableCell" as const,
          },
        ]
      }

      if (rowIndex === 1) {
        return [
          {
            content: [paragraph],
            type: "tableCell" as const,
          },
        ]
      }

      return [
        {
          content: [paragraph],
          type: "tableCell" as const,
        },
        {
          content: [paragraph],
          type: "tableCell" as const,
        },
      ]
    }

    const rows = Array.from({ length: 200 }, (_, rowIndex) => ({
      content: getRowContent(rowIndex),
      type: "tableRow" as const,
    }))

    // Act / Assert
    expect(getTableColumnCount(rows)).toBe(2)
  })

  it("resolves a large table with a rowspan without quadratic blowup", () => {
    // Arrange: 1000×1000 cells; row 0 cell 0 has rowspan 2. Naive rescans are ~10^9 ops.
    const paragraph = {
      content: [{ text: "", type: "text" as const }],
      type: "paragraph" as const,
    }
    const rowCount = 1000
    const cellsPerRow = 1000
    const rows = Array.from({ length: rowCount }, (_, rowIndex) => ({
      content: Array.from({ length: cellsPerRow }, (_, cellIndex) => ({
        attrs:
          rowIndex === 0 && cellIndex === 0
            ? { colspan: 1, rowspan: 2 }
            : { colspan: 1, rowspan: 1 },
        content: [paragraph],
        type: "tableCell" as const,
      })),
      type: "tableRow" as const,
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
