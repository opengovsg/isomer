import type { TableProps } from "~/interfaces"

const longDescription =
  "The Ministry will progressively expand the programme across all towns over the next three years, working with grassroots organisations and residents."

export const denseThreeColumnTable: Pick<TableProps, "attrs" | "content"> = {
  attrs: {
    caption: "Year / Description / Agency",
  },
  content: [
    {
      content: [
        {
          content: [
            {
              content: [{ text: "Year", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableHeader",
        },
        {
          content: [
            {
              content: [{ text: "Description", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableHeader",
        },
        {
          content: [
            {
              content: [{ text: "Agency", type: "text" }],
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
              content: [{ text: "2024", type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableCell",
        },
        {
          content: [
            {
              content: [{ text: longDescription, type: "text" }],
              type: "paragraph",
            },
          ],
          type: "tableCell",
        },
        {
          content: [
            {
              content: [
                {
                  text: "Ministry of Sustainability and the Environment",
                  type: "text",
                },
              ],
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
