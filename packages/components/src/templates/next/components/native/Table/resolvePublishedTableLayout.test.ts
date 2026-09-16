import type { TableProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { resolvePublishedTableLayout } from "./resolvePublishedTableLayout"

type TableRows = TableProps["content"]

const phantomColumnRows: TableRows = [
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

describe("resolvePublishedTableLayout", () => {
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
    expect(
      resolvePublishedTableLayout({
        colwidths: null,
        rows,
        columnCount: 2,
      }),
    ).toEqual({ kind: "auto" })
  })

  it("returns fixed equal-width tracks for staggered merges with a phantom column", () => {
    // Arrange / Act / Assert
    expect(
      resolvePublishedTableLayout({
        colwidths: null,
        rows: phantomColumnRows,
        columnCount: 3,
      }),
    ).toEqual({
      kind: "fixed",
      columnWidths: [`${100 / 3}%`, `${100 / 3}%`, `${100 / 3}%`],
    })
  })

  it("prefers explicit editor colwidths over phantom-column equal widths", () => {
    // Arrange / Act / Assert
    expect(
      resolvePublishedTableLayout({
        colwidths: [50, 25, 25],
        rows: phantomColumnRows,
        columnCount: 3,
      }),
    ).toEqual({
      kind: "fixed",
      columnWidths: ["50%", "25%", "25%"],
    })
  })

  const hostileCell = (colspan: unknown) => ({
    type: "tableCell" as const,
    attrs: colspan !== undefined ? { colspan } : undefined,
    content: [
      {
        type: "paragraph" as const,
        content: [{ type: "text" as const, text: "" }],
      },
    ],
  })
  const hostileRow = (...cells: ReturnType<typeof hostileCell>[]) => ({
    type: "tableRow" as const,
    content: cells,
  })

  it.each([
    {
      label: "overflowing numeric colspan",
      colspan: 4294967296,
      kind: "fixed",
    },
    { label: "negative colspan", colspan: -5, kind: "auto" },
    { label: "string colspan", colspan: "1e9", kind: "auto" },
  ] as const)(
    "returns $kind layout for hostile colspan: $label",
    ({ colspan, kind }) => {
      // Arrange
      const rows = [hostileRow(hostileCell(colspan))] as unknown as TableRows

      // Act
      const layout = resolvePublishedTableLayout({
        colwidths: null,
        rows,
        columnCount: 1,
      })

      // Assert
      expect(layout.kind).toBe(kind)
    },
  )
})
