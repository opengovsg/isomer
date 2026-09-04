import type { TableProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { checkPhantomColumns } from "./hasPhantomColumns"
import { MAX_TABLE_ROWS } from "./tableLayoutLimits"

describe("hasPhantomColumns", () => {
  it("returns false for an empty table", () => {
    // Arrange
    const rows: [] = []

    // Act / Assert
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })

  it("returns false for a plain rectangular table", () => {
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
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })

  it("returns true for staggered merges with a phantom middle column", () => {
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
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(true)
  })

  it("returns false when a full-width header span still has exclusive body cells", () => {
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
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })

  it("returns false for tables above MAX_TABLE_ROWS without scanning every row", () => {
    // Arrange
    const paragraph = {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: "" }],
    }
    const rows = Array.from({ length: MAX_TABLE_ROWS + 1 }, () => ({
      type: "tableRow" as const,
      content: [
        {
          type: "tableCell" as const,
          attrs: { colspan: 1, rowspan: 2 },
          content: [paragraph],
        },
      ],
    })) as TableProps["content"]

    // Act / Assert
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })
})
