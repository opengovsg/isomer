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
})
