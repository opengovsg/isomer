import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import Content from "./Content"

const meta: Meta<typeof Content> = {
  title: "Next/Layouts/Content",
  component: Content,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Content>

export const Default: Story = {
  args: {
    layout: "content",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title:
              "Parent page with a very long title that will likely cause an overflow",
            permalink: "/parent",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title:
                  "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title:
                  "Sibling with a long title that will likely cause an overflow",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "8",
                title:
                  "IrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationalityIrrationality",
                permalink: "/parent/rationality2",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "9",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "10",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "11",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "12",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "13",
                title: "Irrationality3",
                permalink: "/parent/rationality3",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "14",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "15",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "16",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "17",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "18",
                title: "Irrationality4",
                permalink: "/parent/rationality4",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "19",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "20",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "21",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "22",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "23",
                title: "Irrationality5",
                permalink: "/parent/rationality5",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "24",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "25",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "26",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "27",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "28",
                title: "Irrationality6",
                permalink: "/parent/rationality6",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "29",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "30",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "31",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "32",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "33",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
      notification: {
        content: [{ type: "text", text: "This is a short notification" }],
      },
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/parent/rationality",
      lastModified: "2024-05-02T14:12:57.160Z",
      title:
        "Irrationality this should have a long long long long long long long title that wraps to the max width of the content header, and its' breadcrumb truncates, but ideally should not be this long",
      contentPageHeader: {
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
    },
    content: [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                type: "text",
                text: "What does the Irrationality Principle support?",
              },
            ],
          },
        ],
      },
      {
        type: "callout",
        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                },
              ],
            },
          ],
        },
      },
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
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
                                      { type: "text", text: "Luncheon meat" },
                                    ],
                                  },
                                ],
                              },
                              {
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Spam" }],
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
                                                text: "Another level below",
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
                                                text: "This is very deep",
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
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "hello" }],
                                  },
                                ],
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
                            content: [{ type: "text", text: "Back out again" }],
                          },
                        ],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { type: "text", text: "Checklist for sheer irrationality" },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ type: "text", text: "If you are a small business" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Your business must have:" }],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
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
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
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
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "table",
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
                        content: [
                          { type: "text", text: "Date of Entry into Force" },
                        ],
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
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "ASEAN" }],
                      },
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
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "" }],
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
                          { type: "text", text: "Belgium and Luxembourg" },
                        ],
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
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is yet another paragraph" }],
          },
          {
            type: "heading",
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ type: "text", text: "But then, if you are listed" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
              },
            ],
          },
        ],
      },
      {
        type: "accordion",
        details: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [{ text: "this is the first item", type: "text" }],
            },
          ],
        },
        summary: "First title for an accordion item",
      },
      {
        type: "accordion",
        details: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [{ text: "this is the second item", type: "text" }],
            },
          ],
        },
        summary: "Second title for the accordion item",
      },
      {
        type: "contentpic",
        imageAlt:
          "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
        imageSrc:
          "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",

        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Professor Rhino Bean",
                },
                { type: "hardBreak" },
                {
                  type: "text",
                  marks: [
                    {
                      type: "bold",
                    },
                  ],
                  text: "Executive Bean",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [],
                  text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
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
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Impressive Size and Strength: ",
                        },
                        {
                          type: "text",
                          text: "Rhinos are among the largest land mammals, with powerful builds that make them formidable in the wild.",
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
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Unique Horns: ",
                        },
                        {
                          type: "text",
                          text: "Their distinctive horns are not only a symbol of their strength but also serve important roles in defense and foraging.",
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
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Ancient Survivors: ",
                        },
                        {
                          type: "text",
                          text: "Rhinos have been around for millions of years, representing a living link to prehistoric times.",
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
                          marks: [
                            {
                              type: "bold",
                            },
                          ],
                          text: "Ecological Impact: ",
                        },
                        {
                          type: "text",
                          text: "Rhinos play a key role in their ecosystems by helping to maintain the balance of vegetation and supporting other wildlife.",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [],
                  text: "<a href='https://www.traffic.org/news/singapore-rhino-horn-smuggler-24/'>Singapore court gets tough on rhino horn smuggler</a>",
                },
              ],
            },
          ],
        },
      },
      {
        type: "infobar",
        title: "This is a place where you can put nice content",
        description: "About a sentence worth of description here",
        buttonLabel: "Primary CTA",
        buttonUrl: "https://google.com",
        secondaryButtonLabel: "Secondary CTA",
        secondaryButtonUrl: "https://google.com",
      },
      {
        type: "infocards",
        title:
          "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
        subtitle:
          "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
        variant: "cardsWithImages",
        cards: [
          {
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
          {
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
            description:
              "Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile. Explore Duxton with us and leave with a full belly, tipsy mind, and a happy smile.",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
          {
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
          {
            title: "A yummy, tipsy evening at Duxton",
            url: "https://www.google.com",
            imageUrl: "https://placehold.co/200x300",
            imageAlt: "alt text",
          },
        ],
      },
      {
        type: "infocols",
        title: "Highlights",
        subtitle: "Some of the things that we are working on",
        infoBoxes: [
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "/faq",
            icon: "bar-chart",
          },
          {
            title: "Committee of Supply (COS) 2023",
            description: "Building a Vibrant Economy, Nurturing Enterprises",
            buttonLabel: "Read article",
            buttonUrl: "https://google.com",
            icon: "bar-chart",
          },
        ],
      },
      {
        type: "keystatistics",
        title: "Key economic indicators",
        statistics: [
          {
            label: "Advance GDP Estimates, 4Q 2023 (YoY)",
            value: "+2.8%",
          },
          { label: "Total Merchandise Trade, Dec 2023 (YoY)", value: "-6.8%" },
          { label: "Industrial Production, Dec 2023 (YoY)", value: "-2.5%" },
        ],
      },
    ],
  },
}

export const NoTable: Story = {
  args: {
    layout: "content",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Parent page",
            permalink: "/parent",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
      assetsBaseUrl: "https://isomer-user-content.by.gov.sg",
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/parent/rationality",
      title: "Irrationality",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
    },
    content: [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                type: "text",
                text: "What does the Irrationality Principle support?",
              },
            ],
          },
        ],
      },
      {
        type: "callout",
        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                },
              ],
            },
          ],
        },
      },
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
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
                                      { type: "text", text: "Luncheon meat" },
                                    ],
                                  },
                                ],
                              },
                              {
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Spam" }],
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
                                                text: "Another level below",
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
                                                text: "This is very deep",
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
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "hello" }],
                                  },
                                ],
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
                            content: [{ type: "text", text: "Back out again" }],
                          },
                        ],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { type: "text", text: "Checklist for sheer irrationality" },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ type: "text", text: "If you are a small business" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Your business must have:" }],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
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
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
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
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [
                  {
                    type: "link",
                    attrs: {
                      href: "[resource:1:8]",
                    },
                  },
                ],
                text: "This is yet another paragraph",
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ type: "text", text: "But then, if you are listed" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
              },
            ],
          },
        ],
      },
      {
        type: "image",
        src: "/placeholder_no_image.png",
        size: "smaller",
        alt: "alt",
        caption: "A caption",
      },
    ],
  },
}

export const SmallTable: Story = {
  args: {
    layout: "content",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Parent page",
            permalink: "/parent",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/parent/rationality",
      title: "Irrationality",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
    },
    content: [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                type: "text",
                text: "What does the Irrationality Principle support?",
              },
            ],
          },
        ],
      },
      {
        type: "callout",
        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                },
              ],
            },
          ],
        },
      },
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
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
                                      { type: "text", text: "Luncheon meat" },
                                    ],
                                  },
                                ],
                              },
                              {
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Spam" }],
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
                                                text: "Another level below",
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
                                                text: "This is very deep",
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
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "hello" }],
                                  },
                                ],
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
                            content: [{ type: "text", text: "Back out again" }],
                          },
                        ],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { type: "text", text: "Checklist for sheer irrationality" },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions.",
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ type: "text", text: "If you are a small business" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Your business must have:" }],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
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
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
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
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "table",
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
                        content: [{ type: "text", text: "ASEAN" }],
                      },
                    ],
                  },
                  {
                    type: "tableCell",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Some text here" }],
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
                        content: [{ type: "text", text: "Some text here" }],
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
                        content: [{ type: "text", text: "Some text here" }],
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
                        content: [{ type: "text", text: "Some text here" }],
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
                          { type: "text", text: "Belgium and Luxembourg" },
                        ],
                      },
                    ],
                  },
                  {
                    type: "tableCell",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Some text here" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is yet another paragraph" }],
          },
          {
            type: "heading",
            attrs: {
              id: "section3",
              level: 3,
            },
            content: [
              {
                type: "text",
                text: "Test this is a long heading that comes right before a h4",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "What if got some small text here like the section below this is going to explain blah blah",
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ type: "text", text: "But then, if you are listed" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
              },
            ],
          },
        ],
      },
    ],
  },
}

export const FirstLevelPage: Story = {
  args: {
    layout: "content",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Content page",
            permalink: "/content",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/content",
      title: "Content page",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
    },
    content: [
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                type: "text",
                text: "What does the Irrationality Principle support?",
              },
            ],
          },
        ],
      },
      {
        type: "callout",
        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                },
              ],
            },
          ],
        },
      },
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
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
                                      { type: "text", text: "Luncheon meat" },
                                    ],
                                  },
                                ],
                              },
                              {
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Spam" }],
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
                                                text: "Another level below",
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
                                                text: "This is very deep",
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
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "hello" }],
                                  },
                                ],
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
                            content: [{ type: "text", text: "Back out again" }],
                          },
                        ],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { type: "text", text: "Checklist for sheer irrationality" },
            ],
          },
          {
            type: "heading",
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ type: "text", text: "If you are a small business" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Your business must have:" }],
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
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
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
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
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
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is yet another paragraph" }],
          },
          {
            type: "heading",
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ type: "text", text: "But then, if you are listed" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
              },
            ],
          },
        ],
      },
    ],
  },
}

export const MultipleAccordions: Story = {
  args: {
    layout: "content",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Content page",
            permalink: "/content",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/content",
      title: "Content page",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
    },
    content: [
      {
        type: "accordion",
        summary: "This accordion should not have a margin above",
        details: {
          type: "prose",
          content: [],
        },
      },
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: {
              level: 3,
            },
            content: [
              {
                type: "text",
                text: "Some heading",
              },
            ],
          },
        ],
      },
      {
        type: "accordion",
        summary: "Some accordion",
        details: {
          type: "prose",
          content: [],
        },
      },
      {
        type: "accordion",
        summary: "More accordion",
        details: {
          type: "prose",
          content: [],
        },
      },
      {
        type: "accordion",
        summary: "Last accordion in this section",
        details: {
          type: "prose",
          content: [],
        },
      },
      {
        type: "prose",
        content: [
          {
            type: "heading",
            attrs: {
              level: 3,
            },
            content: [
              {
                type: "text",
                text: "More heading",
              },
            ],
          },
        ],
      },
      {
        type: "accordion",
        summary: "Should have a spacing above",
        details: {
          type: "prose",
          content: [],
        },
      },
    ],
  },
}

export const MultipleInfobars: Story = {
  args: {
    layout: "content",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Isomer Next",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Content page",
            permalink: "/content",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "Irrationality",
                permalink: "/parent/rationality",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
                    title: "For Individuals",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                  {
                    id: "5",
                    title: "Steven Pinker's Rationality",
                    permalink: "/parent/rationality/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
              {
                id: "6",
                title: "Sibling",
                permalink: "/parent/sibling",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "7",
                    title: "Child that should not appear",
                    permalink: "/parent/sibling/child-page-2",
                    lastModified: "",
                    layout: "content",
                    summary: "",
                  },
                ],
              },
            ],
          },
          {
            id: "8",
            title: "Aunt/Uncle that should not appear",
            permalink: "/aunt-uncle",
            lastModified: "",
            layout: "content",
            summary: "",
          },
        ],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "/.storybook/assets/isomer-logo.svg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      lastUpdated: "1 Jan 2021",
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/content",
      title: "Content page",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
    },
    content: [
      {
        type: "infobar",
        title: "First item in the page - should not have a gap above",
        description: "About a sentence worth of description here",
      },
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "should have a gap below",
              },
            ],
          },
        ],
      },
      {
        type: "infobar",
        title: "This is a place where you can put nice content",
        description: "About a sentence worth of description here",
      },
      {
        type: "infobar",
        title: "Should have a gap above",
        description: "About a sentence worth of description here",
      },
    ],
  },
}
