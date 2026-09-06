import type { TableProps } from "~/interfaces"

export const staggeredPhantomMerge: Pick<TableProps, "attrs" | "content"> = {
  attrs: {
    caption: "Staggered merges (3 logical columns)",
  },
  content: [
    {
      content: [
        {
          attrs: { colspan: 1, rowspan: 1 },
          content: [
            {
              content: [{ text: "H1", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableHeader",
        },
        {
          attrs: { colspan: 2, rowspan: 1 },
          content: [
            {
              content: [{ text: "H2 + H3", type: "text" }],
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
          attrs: { colspan: 2, rowspan: 2 },
          content: [
            {
              content: [{ text: "A1+B1 / A2+B2", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableCell",
        },
        {
          attrs: { colspan: 1, rowspan: 1 },
          content: [
            {
              content: [{ text: "C1", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableCell",
        },
      ],
      type: "tableRow",
    },
    {
      content: [
        {
          attrs: { colspan: 1, rowspan: 1 },
          content: [
            {
              content: [{ text: "C2", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableCell",
        },
      ],
      type: "tableRow",
    },
  ],
}
