import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers"

import { Table } from "./Table"

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
  it("emits three equal-width cols for staggered merges with a phantom middle column", () => {
    // Arrange / Act
    const html = renderToStaticMarkup(
      <Table
        type="table"
        site={generateSiteConfig()}
        attrs={{
          caption: "Staggered merges — logical 3 columns",
        }}
        content={staggeredMergesContent}
      />,
    )

    // Assert
    expect(html).toContain('class="w-full table-fixed')
    expect(html).toContain("<colgroup>")
    const colWidths = [...html.matchAll(/<col style="width:([^"]+)"\/?>/g)].map(
      (match) => match[1],
    )
    expect(colWidths).toEqual([`${100 / 3}%`, `${100 / 3}%`, `${100 / 3}%`])
    expect(html).toContain('colSpan="2"')
    expect(html).toContain('rowspan="2"')
  })

  it("emits two cols for a plain 2-column table", () => {
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

    // Assert — do not invent a third column
    const colWidths = [...html.matchAll(/<col style="width:([^"]+)"\/?>/g)].map(
      (match) => match[1],
    )
    expect(colWidths).toEqual(["50%", "50%"])
  })
})
