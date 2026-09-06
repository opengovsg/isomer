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
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })

  it("returns true for staggered merges with a phantom middle column", () => {
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
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(true)
  })

  it("returns false when a full-width header span still has exclusive body cells", () => {
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
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })

  it("returns false for tables above MAX_TABLE_ROWS without scanning every row", () => {
    // Arrange
    const paragraph = {
      content: [{ text: "", type: "text" as const }],
      type: "paragraph" as const,
    }
    // SAFETY: Test builds a large TipTap table fixture for row-cap behavior.
    const rows = Array.from({ length: MAX_TABLE_ROWS + 1 }, () => ({
      content: [
        {
          attrs: { colspan: 1, rowspan: 2 },
          content: [paragraph],
          type: "tableCell" as const,
        },
      ],
      type: "tableRow" as const,
    })) as TableProps["content"]

    // Act / Assert
    expect(checkPhantomColumns(rows).hasPhantomColumns).toBe(false)
  })
})
