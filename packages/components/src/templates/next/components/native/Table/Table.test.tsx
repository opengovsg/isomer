import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Table } from "./Table"
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "./tableLayoutLimits"

const staggeredMergesContent = [
  {
    content: [
      {
        attrs: { colspan: 1, rowspan: 1 },
        content: [
          {
            content: [{ text: "H1", type: "text" as const }],
            type: "paragraph" as const,
          },
        ],
        type: "tableHeader" as const,
      },
      {
        attrs: { colspan: 2, rowspan: 1 },
        content: [
          {
            content: [{ text: "H2 + H3", type: "text" as const }],
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
            content: [{ text: "A1+B1 / A2+B2", type: "text" as const }],
            type: "paragraph" as const,
          },
        ],
        type: "tableCell" as const,
      },
      {
        attrs: { colspan: 1, rowspan: 1 },
        content: [
          {
            content: [{ text: "C1", type: "text" as const }],
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
            content: [{ text: "C2", type: "text" as const }],
            type: "paragraph" as const,
          },
        ],
        type: "tableCell" as const,
      },
    ],
    type: "tableRow" as const,
  },
]

describe("Table colgroup", () => {
  it("uses fixed equal-width cols for staggered merges with a phantom middle column", () => {
    // Arrange / Act
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{
          caption: "Staggered merges (3 logical columns)",
        }}
        content={staggeredMergesContent}
      />,
    )

    // Assert
    expect(html).toContain("table-fixed")
    expect(html).toContain("<colgroup>")
    // SSR <col> with inline width; trailing /> is optional in React markup.
    const colWidths = [...html.matchAll(/<col style="width:([^"]+)"\/?>/g)].map(
      (match) => match[1],
    )
    expect(colWidths).toEqual([`${100 / 3}%`, `${100 / 3}%`, `${100 / 3}%`])
    expect(html).toContain('colSpan="2"')
    expect(html).toContain('rowspan="2"')
  })

  it("keeps auto layout and omits colgroup for a plain 2-column table", () => {
    // Arrange / Act
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{ caption: "Two columns" }}
        content={[
          {
            content: [
              {
                content: [
                  {
                    content: [{ text: "A", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableHeader",
              },
              {
                content: [
                  {
                    content: [{ text: "B", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableHeader",
              },
            ],
            type: "tableRow",
          },
        ]}
      />,
    )

    // Assert
    expect(html).not.toContain("table-fixed")
    expect(html).not.toContain("<colgroup>")
    // No <col> tags at all when colgroup is omitted.
    expect(html).not.toMatch(/<col[\s>]/)
  })

  it("keeps auto layout when a header span still has exclusive body cells", () => {
    // Arrange / Act
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{ caption: "Full-width header" }}
        content={[
          {
            content: [
              {
                attrs: { colspan: 3 },
                content: [
                  {
                    content: [{ text: "Title", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableHeader",
              },
            ],
            type: "tableRow",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [{ text: "A", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableCell",
              },
              {
                content: [
                  {
                    content: [{ text: "B", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableCell",
              },
              {
                content: [
                  {
                    content: [{ text: "C", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableCell",
              },
            ],
            type: "tableRow",
          },
        ]}
      />,
    )

    // Assert
    expect(html).not.toContain("table-fixed")
    expect(html).not.toContain("<colgroup>")
  })

  it("normalizes hostile colspan and rowspan in SSR output", () => {
    // Arrange / Act
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{ caption: "Hostile spans" }}
        content={[
          {
            content: [
              {
                attrs: { colspan: 1_000_000, rowspan: 1_000_000 },
                content: [
                  {
                    content: [{ text: "A", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableCell",
              },
            ],
            type: "tableRow",
          },
        ]}
      />,
    )

    // Assert
    expect(html).toContain(`colSpan="${MAX_TABLE_COLUMNS}"`)
    expect(html).toContain(`rowspan="${MAX_TABLE_ROWS}"`)
    expect(html).not.toContain('colSpan="1000000"')
    expect(html).not.toContain('rowspan="1000000"')
  })

  it("preserves legitimate rowspans above the column cap", () => {
    // Arrange / Act
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{ caption: "Long rowspan" }}
        content={[
          {
            content: [
              {
                attrs: { colspan: 1, rowspan: 65 },
                content: [
                  {
                    content: [{ text: "A", type: "text" }],
                    type: "paragraph",
                  },
                ],
                type: "tableCell",
              },
            ],
            type: "tableRow",
          },
        ]}
      />,
    )

    // Assert
    expect(html).toContain('rowspan="65"')
    expect(html).not.toContain('rowspan="64"')
  })
})
