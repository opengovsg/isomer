import type { Meta, StoryFn } from "@storybook/react"
import Table from "./Table"
import type { TableProps } from "~/interfaces"

export default {
  title: "Next/Components/Table",
  component: Table,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<TableProps> = (args) => <Table {...args} />

export const Simple = Template.bind({})
Simple.args = {
  caption: "A table of IIA countries (2024)",
  content: [
    {
      type: "tableRow",
      content: [
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Countries" }],
            },
          ],
        },
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Date of Entry into Force" }],
            },
          ],
        },
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "IIA Text" }],
            },
          ],
        },
        {
          type: "tableHeader",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Some numbers" }],
            },
          ],
        },
        {
          type: "tableHeader",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Remarks" }] },
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
            { type: "paragraph", content: [{ type: "text", text: "ASEAN" }] },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "2 Aug 1998" }],
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
                  text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                },
              ],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "123,456" }] },
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
                  text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                },
              ],
            },
            {
              type: "unorderedlist",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>AANZFTA</a>",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>ACFTA</a>",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>AKFTA</a>",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>AIFTA</a>",
                        },
                      ],
                    },
                  ],
                },
              ],
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
            { type: "paragraph", content: [{ type: "text", text: "Bahrain" }] },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "8 Dec 2004" }],
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
                  text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                },
              ],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "123,456" }] },
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
                  text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                },
              ],
            },
            {
              type: "orderedlist",
              content: [
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>AANZFTA</a>",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>ACFTA</a>",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>AKFTA</a>",
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "listItem",
                  content: [
                    {
                      type: "paragraph",
                      content: [
                        {
                          type: "text",
                          text: "<a href='https://google.com'>AIFTA</a>",
                        },
                      ],
                    },
                  ],
                },
              ],
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
              content: [{ type: "text", text: "Bangladesh" }],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "19 Nov 2004" }],
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
                  text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                },
              ],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "123,456" }] },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Some text" }],
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
            { type: "paragraph", content: [{ type: "text", text: "Belarus" }] },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "13 Jan 2001" }],
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
                  text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                },
              ],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "123,456" }] },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "" }] },
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
              content: [{ type: "text", text: "Belgium and Luxembourg" }],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "27 Nov 1980" }],
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
                  text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                },
              ],
            },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "123,456" }] },
          ],
        },
        {
          type: "tableCell",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "" }] },
          ],
        },
      ],
    },
  ],
}
