import type { TableProps } from "~/interfaces"

export const staggeredPhantomMerge: Pick<TableProps, "attrs" | "content"> = {
  attrs: {
    caption: "Staggered merges (3 logical columns)",
  },
  content: [
    {
      type: "tableRow",
      content: [
        {
          type: "tableHeader",
          attrs: { colspan: 1, rowspan: 1 },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "H1" }],
            },
          ],
        },
        {
          type: "tableHeader",
          attrs: { colspan: 2, rowspan: 1 },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "H2 + H3" }],
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
          attrs: { colspan: 2, rowspan: 2 },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "A1+B1 / A2+B2" }],
            },
          ],
        },
        {
          type: "tableCell",
          attrs: { colspan: 1, rowspan: 1 },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "C1" }],
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
          attrs: { colspan: 1, rowspan: 1 },
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "C2" }],
            },
          ],
        },
      ],
    },
  ],
}
