import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Table } from "./Table"
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "./tableLayoutLimits"

const staggeredMergesContent = [
  {
    type: "tableRow" as const,
    content: [
      {
        type: "tableHeader" as const,
        attrs: { colspan: 1, rowspan: 1 },
        content: [
          {
            type: "paragraph" as const,
            content: [{ type: "text" as const, text: "H1" }],
          },
        ],
      },
      {
        type: "tableHeader" as const,
        attrs: { colspan: 2, rowspan: 1 },
        content: [
          {
            type: "paragraph" as const,
            content: [{ type: "text" as const, text: "H2 + H3" }],
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
            content: [{ type: "text" as const, text: "A1+B1 / A2+B2" }],
          },
        ],
      },
      {
        type: "tableCell" as const,
        attrs: { colspan: 1, rowspan: 1 },
        content: [
          {
            type: "paragraph" as const,
            content: [{ type: "text" as const, text: "C1" }],
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
            content: [{ type: "text" as const, text: "C2" }],
          },
        ],
      },
    ],
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
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "A" }],
                  },
                ],
              },
              {
                type: "tableHeader",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "B" }],
                  },
                ],
              },
            ],
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
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                attrs: { colspan: 3 },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Title" }],
                  },
                ],
              },
            ],
          },
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "A" }],
                  },
                ],
              },
              {
                type: "tableCell",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "B" }],
                  },
                ],
              },
              {
                type: "tableCell",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "C" }],
                  },
                ],
              },
            ],
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
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                attrs: { colspan: 1_000_000, rowspan: 1_000_000 },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "A" }],
                  },
                ],
              },
            ],
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
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                attrs: { colspan: 1, rowspan: 65 },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "A" }],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    )

    // Assert
    expect(html).toContain('rowspan="65"')
    expect(html).not.toContain('rowspan="64"')
  })
})

describe("Table backgroundColor", () => {
  it("paints palette colours on header and body cells", () => {
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{ caption: "Colours by kind" }}
        content={[
          {
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                attrs: { backgroundColor: "pink" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Pink header" }],
                  },
                ],
              },
              {
                type: "tableHeader",
                attrs: { backgroundColor: "blue" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Blue header" }],
                  },
                ],
              },
            ],
          },
          {
            type: "tableRow",
            content: [
              {
                type: "tableCell",
                attrs: { backgroundColor: "green" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Green body" }],
                  },
                ],
              },
              {
                type: "tableCell",
                attrs: { backgroundColor: "blue" },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Blue body" }],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    )

    const openTags = [...html.matchAll(/<(th|td)\b[^>]*>/g)].map((m) => m[0])
    const [thPink, thBlue, tdGreen, tdBlue] = openTags

    expect(thPink).toContain("background-color:#F7EBF1")
    expect(thBlue).toContain("background-color:#EBECF7")
    expect(tdGreen).toContain("background-color:#E9F6EC")
    expect(tdBlue).toContain("background-color:#EBECF7")
  })

  it("renders th and td per cell in a header-column row", () => {
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{ caption: "Header column" }}
        content={[
          {
            type: "tableRow",
            content: [
              {
                type: "tableHeader",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Header" }],
                  },
                ],
              },
              {
                type: "tableCell",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Body" }],
                  },
                ],
              },
            ],
          },
        ]}
      />,
    )

    const cellTags = [...html.matchAll(/<(th|td)\b/g)].map((match) => match[1])

    expect(cellTags).toEqual(["th", "td"])
  })
})
