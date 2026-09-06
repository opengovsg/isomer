import type { Meta, StoryObj } from "@storybook/react-vite"
import { generateSiteConfig } from "~/stories/helpers"

import { Table } from "./Table"

const meta: Meta<typeof Table> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Table,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Table",
}
export default meta
type Story = StoryObj<typeof Table>

export const Simple: Story = {
  args: {
    attrs: {
      caption: "A table of IIA countries (2024)",
    },
    content: [
      {
        content: [
          {
            content: [
              {
                content: [{ text: "Countries", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Date of Entry into Force", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "IIA Text", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Some numbers", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Remarks", type: "text" }],
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
              { content: [{ text: "ASEAN", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "2 Aug 1998", type: "text" }],
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
                    text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
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
                    text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AANZFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>ACFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AKFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AIFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "unorderedList",
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
            content: [
              {
                content: [{ text: "Bahrain", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "8 Dec 2004", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
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
                    text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AANZFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>ACFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AKFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AIFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "orderedList",
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
            content: [
              {
                content: [{ text: "Bangladesh", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "19 Nov 2004", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "Some text", type: "text" }],
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
            content: [
              {
                content: [{ text: "Belarus", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "13 Jan 2001", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              { content: [{ text: "", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
      {
        content: [
          {
            content: [
              {
                content: [{ text: "Belgium and Luxembourg", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "27 Nov 1980", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              { content: [{ text: "", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
    ],
  },
}

export const Rowspan: Story = {
  args: {
    attrs: {
      caption:
        "A table of IIA countries (2024), the quick brown fox jumps over the lazy dog",
    },
    content: [
      {
        content: [
          {
            attrs: {
              rowspan: 2,
            },
            content: [
              {
                content: [
                  {
                    text: "S/N",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            attrs: {
              colspan: 4,
            },
            content: [
              {
                content: [
                  {
                    text: "Columns",
                    type: "text",
                  },
                ],
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
                content: [{ text: "Date of Entry into Force", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "IIA Text", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Some numbers", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Remarks", type: "text" }],
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
              { content: [{ text: "1", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "2 Aug 1998", type: "text" }],
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
                    text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
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
                    text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AANZFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>ACFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AKFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AIFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "unorderedList",
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
            content: [
              { content: [{ text: "2", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "8 Dec 2004", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
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
                    text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AANZFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>ACFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AKFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AIFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "orderedList",
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
            content: [
              {
                content: [{ text: "3", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "19 Nov 2004", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "Some text", type: "text" }],
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
            content: [
              { content: [{ text: "4", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "13 Jan 2001", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              { content: [{ text: "", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
      {
        content: [
          {
            content: [
              {
                content: [{ text: "5", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "27 Nov 1980", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              { content: [{ text: "", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
    ],
  },
}

export const Colspan: Story = {
  args: {
    attrs: {
      caption: "A table of IIA countries (2024)",
    },
    content: [
      {
        content: [
          {
            attrs: {
              colspan: 5,
            },
            content: [
              {
                content: [
                  {
                    text: "This might be the table of the table for some reason",
                    type: "text",
                  },
                ],
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
            attrs: {
              colspan: 3,
            },
            content: [
              {
                content: [
                  {
                    text: "This is the first part",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            attrs: {
              colspan: 2,
            },
            content: [
              {
                content: [
                  {
                    text: "And this is not the only thing",
                    type: "text",
                  },
                ],
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
                content: [{ text: "Countries", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Date of Entry into Force", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "IIA Text", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Some numbers", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Remarks", type: "text" }],
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
              { content: [{ text: "ASEAN", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "2 Aug 1998", type: "text" }],
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
                    text: "<a href='https://www.asean.org/asean/asean-agreements-on-investment/'>EN download (3.2 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
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
                    text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AANZFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>ACFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AKFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AIFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "unorderedList",
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
            content: [
              {
                content: [{ text: "Bahrain", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "8 Dec 2004", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
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
                    text: "The ASEAN IGA was terminated when <a href='https://www.asean.org/asean/asean-agreements-on-investment/'>ACIA</a> entered into force on 29 Mar 2012.",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    text: "The ASEAN Member States are parties to the following FTAs with Investment chapters (which also contain provisions on investment promotion):",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AANZFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>ACFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AKFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>AIFTA</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "orderedList",
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
            content: [
              {
                content: [{ text: "Bangladesh", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "19 Nov 2004", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "Some text", type: "text" }],
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
            content: [
              {
                content: [{ text: "Belarus", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "13 Jan 2001", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              { content: [{ text: "", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
      {
        content: [
          {
            content: [
              {
                content: [{ text: "Belgium and Luxembourg", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "27 Nov 1980", type: "text" }],
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
                    text: "<a href='https://google.com/'>EN download (2.4 MB)</a>",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              {
                content: [{ text: "123,456", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            content: [
              { content: [{ text: "", type: "text" }], type: "paragraph" },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
    ],
  },
}

export const NestedColumns: Story = {
  args: {
    attrs: {
      caption: "Something per Testing Cycle",
    },
    content: [
      {
        content: [
          {
            attrs: {
              colspan: 3,
            },
            content: [
              {
                content: [
                  {
                    text: "",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [
                  {
                    text: "Testing Couple",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [
                  {
                    text: "Non-testing Couple",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [
                  {
                    text: "Something else Couple",
                    type: "text",
                  },
                ],
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
            attrs: {
              colspan: 3,
            },
            content: [
              {
                content: [
                  {
                    text: "ABC",
                    type: "text",
                  },
                  {
                    marks: [
                      {
                        type: "superscript",
                      },
                    ],
                    text: "1",
                    type: "text",
                  },
                ],
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
                    text: "75%; up to $3,260",
                    type: "text",
                  },
                ],
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
                    text: "55%; up to $2,390",
                    type: "text",
                  },
                ],
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
                    text: "35%; up to $1,520",
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
      {
        content: [
          {
            attrs: {
              colspan: 3,
            },
            content: [
              {
                content: [
                  {
                    text: "Another type",
                    type: "text",
                  },
                ],
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
                    text: "75%; up to $8,990",
                    type: "text",
                  },
                ],
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
                    text: "55%; up to $6,590",
                    type: "text",
                  },
                ],
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
                    text: "35%; up to $4,190",
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
      {
        content: [
          {
            attrs: {
              rowspan: 3,
            },
            content: [
              {
                content: [
                  {
                    text: "TEST-M",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
            ],
            type: "tableCell",
          },
          {
            attrs: {
              rowspan: 2,
            },
            content: [
              {
                content: [
                  {
                    text: "Work-up",
                    type: "text",
                  },
                ],
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
                    text: "Common",
                    type: "text",
                  },
                ],
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
                    text: "75%; up to $8,980",
                    type: "text",
                  },
                ],
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
                    text: "55%; up to $6,590",
                    type: "text",
                  },
                ],
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
                    text: "35%; up to $4,190",
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
      {
        content: [
          {
            content: [
              {
                content: [
                  {
                    text: "Rare",
                    type: "text",
                  },
                ],
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
                    text: "75%; up to $23,300",
                    type: "text",
                  },
                ],
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
                    text: "55%; up to $17,090",
                    type: "text",
                  },
                ],
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
                    text: "35%; up to $10,880",
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
      {
        content: [
          {
            attrs: {
              colspan: 2,
            },
            content: [
              {
                content: [
                  {
                    text: "Testing (Common/Rare)",
                    type: "text",
                  },
                ],
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
                    text: "75%; up to $4,860",
                    type: "text",
                  },
                ],
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
                    text: "55%; up to $3,560",
                    type: "text",
                  },
                ],
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
                    text: "35%; up to $2,270",
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
      {
        content: [
          {
            attrs: {
              colspan: 6,
            },
            content: [
              {
                content: [
                  {
                    marks: [
                      {
                        type: "superscript",
                      },
                      {
                        type: "italic",
                      },
                    ],
                    text: "1",
                    type: "text",
                  },
                  {
                    marks: [
                      {
                        type: "italic",
                      },
                    ],
                    text: "ABC co-funding will only be available at public ZXC centres and must be conducted as part of a TEST cycle to be eligible for co-funding.",
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
  },
}

export const ListInTable: Story = {
  args: {
    attrs: {
      caption: "Resources for the scheme",
    },
    content: [
      {
        content: [
          {
            content: [
              {
                content: [{ text: "Category", type: "text" }],
                type: "paragraph",
              },
            ],
            type: "tableHeader",
          },
          {
            content: [
              {
                content: [{ text: "Files for download", type: "text" }],
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
                content: [{ text: "Files for everyone", type: "text" }],
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
                    text: "Here are some files you can download:",
                    type: "text",
                  },
                ],
                type: "paragraph",
              },
              {
                content: [
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>A long file name that's available for download [PDF, 2MB]</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>An even longer file name that's available for download [PDF, 2MB]</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>A long file name that's available for download [PDF, 2MB]</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                  {
                    content: [
                      {
                        content: [
                          {
                            text: "<a href='https://google.com'>A very very very long file name that's available for download [PDF, 2MB]</a>",
                            type: "text",
                          },
                        ],
                        type: "paragraph",
                      },
                    ],
                    type: "listItem",
                  },
                ],
                type: "unorderedList",
              },
            ],
            type: "tableCell",
          },
        ],
        type: "tableRow",
      },
    ],
  },
}

/**
 * Staggered merges: row 1 spans cols 2-3, row 2 spans cols 1-2 (rowspan 2).
 * No cell sits alone in column 2. Auto layout collapses that track without colgroup.
 */
export const StaggeredMergesPhantomColumn: Story = {
  args: {
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
  },
}
