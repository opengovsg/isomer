import type { Meta, StoryObj } from "@storybook/react"

import Table from "./Table"
import { generateSiteConfig } from ".storybook/helpers"

const meta: Meta<typeof Table> = {
  title: "Next/Components/Table",
  component: Table,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
  },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "Remarks" }],
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
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
                type: "unorderedList",
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
                content: [{ type: "text", text: "Bahrain" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
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
                type: "orderedList",
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "Belarus" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
        type: "tableRow",
        content: [
          {
            type: "tableHeader",
            attrs: {
              rowspan: 2,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "S/N",
                  },
                ],
              },
            ],
          },
          {
            type: "tableHeader",
            attrs: {
              colspan: 4,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Columns",
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "Remarks" }],
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
              { type: "paragraph", content: [{ type: "text", text: "1" }] },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
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
                type: "unorderedList",
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
              { type: "paragraph", content: [{ type: "text", text: "2" }] },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
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
                type: "orderedList",
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
                content: [{ type: "text", text: "3" }],
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
              { type: "paragraph", content: [{ type: "text", text: "4" }] },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
                content: [{ type: "text", text: "5" }],
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
  },
}

export const Colspan: Story = {
  args: {
    attrs: {
      caption: "A table of IIA countries (2024)",
    },
    content: [
      {
        type: "tableRow",
        content: [
          {
            type: "tableHeader",
            attrs: {
              colspan: 5,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "This might be the table of the table for some reason",
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
            type: "tableHeader",
            attrs: {
              colspan: 3,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "This is the first part",
                  },
                ],
              },
            ],
          },
          {
            type: "tableHeader",
            attrs: {
              colspan: 2,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "And this is not the only thing",
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "Remarks" }],
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
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
                type: "unorderedList",
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
                content: [{ type: "text", text: "Bahrain" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
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
                type: "orderedList",
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "Belarus" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
              {
                type: "paragraph",
                content: [{ type: "text", text: "123,456" }],
              },
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
  },
}

export const NestedColumns: Story = {
  args: {
    attrs: {
      caption: "Something per Testing Cycle",
    },
    content: [
      {
        type: "tableRow",
        content: [
          {
            type: "tableHeader",
            attrs: {
              colspan: 3,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "",
                  },
                ],
              },
            ],
          },
          {
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Testing Couple",
                  },
                ],
              },
            ],
          },
          {
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Non-testing Couple",
                  },
                ],
              },
            ],
          },
          {
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Something else Couple",
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
            attrs: {
              colspan: 3,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "ABC",
                  },
                  {
                    type: "text",
                    marks: [
                      {
                        type: "superscript",
                      },
                    ],
                    text: "1",
                  },
                ],
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
                    text: "75%; up to $3,260",
                  },
                ],
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
                    text: "55%; up to $2,390",
                  },
                ],
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
                    text: "35%; up to $1,520",
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
            attrs: {
              colspan: 3,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Another type",
                  },
                ],
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
                    text: "75%; up to $8,990",
                  },
                ],
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
                    text: "55%; up to $6,590",
                  },
                ],
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
                    text: "35%; up to $4,190",
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
            attrs: {
              rowspan: 3,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "TEST-M",
                  },
                ],
              },
            ],
          },
          {
            type: "tableCell",
            attrs: {
              rowspan: 2,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Work-up",
                  },
                ],
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
                    text: "Common",
                  },
                ],
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
                    text: "75%; up to $8,980",
                  },
                ],
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
                    text: "55%; up to $6,590",
                  },
                ],
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
                    text: "35%; up to $4,190",
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
                content: [
                  {
                    type: "text",
                    text: "Rare",
                  },
                ],
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
                    text: "75%; up to $23,300",
                  },
                ],
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
                    text: "55%; up to $17,090",
                  },
                ],
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
                    text: "35%; up to $10,880",
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
            attrs: {
              colspan: 2,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Testing (Common/Rare)",
                  },
                ],
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
                    text: "75%; up to $4,860",
                  },
                ],
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
                    text: "55%; up to $3,560",
                  },
                ],
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
                    text: "35%; up to $2,270",
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
            attrs: {
              colspan: 6,
            },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [
                      {
                        type: "superscript",
                      },
                      {
                        type: "italic",
                      },
                    ],
                    text: "1",
                  },
                  {
                    type: "text",
                    marks: [
                      {
                        type: "italic",
                      },
                    ],
                    text: "ABC co-funding will only be available at public ZXC centres and must be conducted as part of a TEST cycle to be eligible for co-funding.",
                  },
                ],
              },
            ],
          },
        ],
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
        type: "tableRow",
        content: [
          {
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Category" }],
              },
            ],
          },
          {
            type: "tableHeader",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Files for download" }],
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
                content: [{ type: "text", text: "Files for everyone" }],
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
                    text: "Here are some files you can download:",
                  },
                ],
              },
              {
                type: "unorderedList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: "<a href='https://google.com'>A long file name that's available for download [PDF, 2MB]</a>",
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
                            text: "<a href='https://google.com'>An even longer file name that's available for download [PDF, 2MB]</a>",
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
                            text: "<a href='https://google.com'>A long file name that's available for download [PDF, 2MB]</a>",
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
                            text: "<a href='https://google.com'>A very very very long file name that's available for download [PDF, 2MB]</a>",
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
    ],
  },
}
