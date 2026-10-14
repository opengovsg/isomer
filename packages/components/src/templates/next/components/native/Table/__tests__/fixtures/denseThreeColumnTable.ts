import type { TableProps } from "~/interfaces"

const longDescription =
  "The Ministry will progressively expand the programme across all towns over the next three years, working with grassroots organisations and residents."

export const denseThreeColumnTable: Pick<TableProps, "attrs" | "content"> = {
  attrs: {
    caption: "Year / Description / Agency",
  },
  content: [
    {
      type: "tableRow",
      content: [
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Year" }],
            },
          ],
        },
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Description" }],
            },
          ],
        },
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Agency" }],
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
              content: [{ type: "text", text: "2024" }],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: longDescription }],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Ministry of Sustainability and the Environment",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
