import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within } from "@storybook/test"

import { withChromaticModes } from "@isomer/storybook-config"

import type { DatabasePageSchemaType } from "~/engine"
import { generateSiteConfig } from "~/stories/helpers"
import { HARDCODED_SMALL_DATASET_RESOURCE_ID } from "../../components/complex/SearchableTable/DGS/DGSSearchableTable.stories"
import Database from "./Database"

const meta: Meta<typeof Database> = {
  title: "Next/Layouts/Database",
  component: Database,
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
type Story = StoryObj<typeof Database>

const generateArgs = ({
  database,
  content = [],
}: {
  database: DatabasePageSchemaType["page"]["database"]
  content?: DatabasePageSchemaType["content"]
}): DatabasePageSchemaType => {
  return {
    layout: "database",
    site: generateSiteConfig({
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
    }),
    meta: {
      description: "A Next.js starter for Isomer",
    },
    page: {
      permalink: "/parent/rationality",
      title: "Irrationality",
      lastModified: "2024-05-02T14:12:57.160Z",
      contentPageHeader: {
        showThumbnail: false,
        summary:
          "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
        buttonLabel: "Submit a proposal",
        buttonUrl: "/submit-proposal",
      },
      database: database,
    },
    content: content,
  }
}

export const Default: Story = {
  name: "Native Searchable Table",
  args: generateArgs({
    database: {
      title: "The Cancer Drug List (CDL)",
      headers: [
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
      ],
      items: [
        [
          "Cell copy 1",
          '=HYPERLINK("https://www.isomer.gov.sg", Cell copy)',
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 2",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 3",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 4",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 5",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 6",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 7",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 8",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 9",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 10",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 11",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 12",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 13",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 14",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 15",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 16",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
      ],
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
  }),
}

export const NoTitle: Story = {
  args: generateArgs({
    database: {
      headers: [
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
      ],
      items: [],
    },
  }),
}

export const Empty: Story = {
  args: generateArgs({
    database: {
      title: "The Cancer Drug List (CDL)",
      headers: [
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
      ],
      items: [],
    },
  }),
}

export const NoSearchResults: Story = {
  args: generateArgs({
    database: {
      title: "The Cancer Drug List (CDL)",
      headers: [
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
        "Header",
      ],
      items: [
        [
          "Cell copy 1",
          '=HYPERLINK("https://www.isomer.gov.sg", Cell copy)',
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 2",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 3",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 4",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 5",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 6",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 7",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 8",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 9",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 10",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 11",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 12",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 13",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 14",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 15",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
        [
          "Cell copy 16",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
          "Cell copy",
        ],
      ],
    },
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)
    const searchElem = screen.getByRole("searchbox", {
      name: /Search table/i,
    })
    await userEvent.type(searchElem, "some whacky search term")
  },
}

export const DGSSearchableTable: Story = {
  name: "DGS Searchable Table",
  args: generateArgs({
    database: {
      title: "Sample DGS Table",
      dataSource: {
        type: "dgs",
        resourceId: HARDCODED_SMALL_DATASET_RESOURCE_ID,
      },
    },
  }),
}

export const DGSSearchableTableWithDefaultTitle: Story = {
  name: "DGS Searchable Table (with default title)",
  args: generateArgs({
    database: {
      dataSource: {
        type: "dgs",
        resourceId: HARDCODED_SMALL_DATASET_RESOURCE_ID,
      },
    },
  }),
}

export const DGSSearchableTableWithHeaders: Story = {
  name: "DGS Searchable Table (with headers)",
  args: generateArgs({
    database: {
      title: "Sample DGS Table",
      dataSource: {
        type: "dgs",
        resourceId: HARDCODED_SMALL_DATASET_RESOURCE_ID,
      },
      headers: [
        { label: "Year", key: "year" },
        { label: "University", key: "university" },
        { label: "School", key: "school" },
        { label: "Degree", key: "degree" },
        { label: "Monthly Median", key: "gross_monthly_median" },
      ],
    },
  }),
}
