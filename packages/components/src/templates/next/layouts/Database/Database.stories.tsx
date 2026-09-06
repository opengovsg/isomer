import type { Meta, StoryObj } from "@storybook/react-vite"
import type { DatabasePageSchemaType } from "~/types"
import { expect, userEvent, waitFor, within } from "storybook/test"
import {
  DGS_SMALL_DATASET_RESOURCE_ID,
  generateSiteConfig,
} from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { DatabaseLayout } from "./Database"

const meta: Meta<typeof DatabaseLayout> = {
  argTypes: {},
  component: DatabaseLayout,
  parameters: {
    chromatic: withChromaticModes(["mobile", "tablet", "desktop"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  tags: ["!autodocs"],
  title: "Next/Layouts/Database",
}
export default meta
type Story = StoryObj<typeof DatabaseLayout>

const generateArgs = ({
  database,
  content = [],
}: {
  database: DatabasePageSchemaType["page"]["database"]
  content?: DatabasePageSchemaType["content"]
}): DatabasePageSchemaType => ({
  content,
  layout: "database",
  meta: {
    description: "A Next.js starter for Isomer",
  },
  page: {
    contentPageHeader: {
      buttonLabel: "Submit a proposal",
      buttonUrl: "/submit-proposal",
      showThumbnail: false,
      summary:
        "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
    },
    database,
    lastModified: "2024-05-02T14:12:57.160Z",
    permalink: "/parent/rationality",
    title: "Irrationality",
  },
  site: generateSiteConfig({
    siteMap: {
      children: [
        {
          children: [
            {
              children: [
                {
                  id: "4",
                  lastModified: "",
                  layout: "content",
                  permalink: "/parent/rationality/child-page-2",
                  summary: "",
                  title: "For Individuals",
                },
                {
                  id: "5",
                  lastModified: "",
                  layout: "content",
                  permalink: "/parent/rationality/child-page-2",
                  summary: "",
                  title: "Steven Pinker's Rationality",
                },
              ],
              id: "3",
              lastModified: "",
              layout: "content",
              permalink: "/parent/rationality",
              summary: "",
              title: "Irrationality",
            },
            {
              children: [
                {
                  id: "7",
                  lastModified: "",
                  layout: "content",
                  permalink: "/parent/sibling/child-page-2",
                  summary: "",
                  title: "Child that should not appear",
                },
              ],
              id: "6",
              lastModified: "",
              layout: "content",
              permalink: "/parent/sibling",
              summary: "",
              title: "Sibling",
            },
          ],
          id: "2",
          lastModified: "",
          layout: "content",
          permalink: "/parent",
          summary: "",
          title: "Parent page",
        },
        {
          id: "8",
          lastModified: "",
          layout: "content",
          permalink: "/aunt-uncle",
          summary: "",
          title: "Aunt/Uncle that should not appear",
        },
      ],
      id: "1",
      lastModified: "",
      layout: "homepage",
      permalink: "/",
      summary: "",
      title: "Isomer Next",
    },
  }),
})

export const Default: Story = {
  args: generateArgs({
    content: [
      {
        content: [
          {
            attrs: {
              id: "section1",
              level: 2,
            },
            content: [
              {
                text: "What does the Irrationality Principle support?",
                type: "text",
              },
            ],
            type: "heading",
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              content: [
                {
                  text: `As of December 1, 2024, the scheme is being reviewed for new criteria in 2025. To view the new criteria please refer to <a href="/faq">New Idea Scheme Proposal</a> while it is being updated.`,
                  type: "text",
                },
              ],
              type: "paragraph",
            },
          ],
          type: "prose",
        },
        type: "callout",
      },
      {
        content: [
          {
            content: [
              {
                text: "Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                        text: "Steven Pinker's Rationality: An Overview Steven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An OverviewSteven Pinker's Rationality: An Overview",
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
                                text: "Like this, you might have a list of equipments to bring to the luncheon",
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
                                      { text: "Luncheon meat", type: "text" },
                                    ],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "Spam", type: "text" }],
                                    type: "paragraph",
                                  },
                                  {
                                    content: [
                                      {
                                        content: [
                                          {
                                            content: [
                                              {
                                                text: "Another level below",
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
                                                text: "This is very deep",
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
                                type: "listItem",
                              },
                              {
                                content: [
                                  {
                                    content: [{ text: "hello", type: "text" }],
                                    type: "paragraph",
                                  },
                                ],
                                type: "listItem",
                              },
                            ],
                            type: "unorderedList",
                          },
                        ],
                        type: "listItem",
                      },
                      {
                        content: [
                          {
                            content: [{ text: "Back out again", type: "text" }],
                            type: "paragraph",
                          },
                        ],
                        type: "listItem",
                      },
                    ],
                    type: "unorderedList",
                  },
                ],
                type: "listItem",
              },
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
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
          {
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              { text: "Checklist for sheer irrationality", type: "text" },
            ],
            type: "heading",
          },
          {
            attrs: {
              id: "section1",
              level: 3,
            },
            content: [{ text: "If you are a small business", type: "text" }],
            type: "heading",
          },
          {
            content: [{ text: "Your business must have:", type: "text" }],
            type: "paragraph",
          },
          {
            content: [
              {
                content: [
                  {
                    content: [
                      {
                        text: "Through Pinker's exploration, readers gain a deeper appreciation for the complexities and nuances of human rationality. (Engaging for individuals curious about the intricacies of human behavior and decision-making processes.)",
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
                        text: "(Suitable for those interested in the interdisciplinary study of cognitive science and psychology.)",
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
                        text: "Practical applications of rationality in daily life are elucidated by Pinker, offering actionable insights for better decision-making. (Beneficial for individuals seeking practical strategies to improve their decision-making processes.)",
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
          {
            content: [
              {
                marks: [
                  {
                    attrs: {
                      href: "[resource:1:8]",
                    },
                    type: "link",
                  },
                ],
                text: "This is yet another paragraph",
                type: "text",
              },
            ],
            type: "paragraph",
          },
          {
            attrs: {
              id: "section3",
              level: 4,
            },
            content: [{ text: "But then, if you are listed", type: "text" }],
            type: "heading",
          },
          {
            content: [
              {
                text: "In the realm of human cognition, irrationality often reigns supreme, defying the logic that ostensibly governs our decisions and actions. It manifests in myriad ways, from the subtle biases that influence our perceptions to the outright contradictions that confound our rational minds. We find ourselves ensnared in cognitive dissonance, grappling with conflicting beliefs and emotions that lead us astray from the path of reason. Despite our best intentions, we succumb to the allure of irrationality, surrendering to the whims of impulse and emotion. Our choices become a tangled web of contradictions, driven by instinct rather than careful deliberation. We cling to superstitions and fallacies, seeking comfort in the irrationality that offers solace amidst life's uncertainties. It is a paradoxical dance, where the irrational often masquerades as wisdom, leading us down paths fraught with confusion and folly. Yet, in embracing our irrationality, we find a peculiar sort of freedom, liberated from the constraints of logic and reason. We navigate the world with a blend of intuition and irrationality, embracing the chaos that defines the human experience. And so, in the tapestry of existence, irrationality weaves its intricate threads, adding depth and complexity to the fabric of our lives.",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "prose",
      },
      {
        alt: "alt",
        caption: "A caption",
        size: "smaller",
        src: "/placeholder_no_image.png",
        type: "image",
      },
    ],
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
      items: [
        [
          "Cell copy 1",
          '<a href="https://www.isomer.gov.sg">Cell copy</a>',
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
      title: "The Cancer Drug List (CDL)",
    },
  }),
  name: "Native Searchable Table",
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
      title: "The Cancer Drug List (CDL)",
    },
  }),
}

export const NoSearchResults: Story = {
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
      items: [
        [
          "Cell copy 1",
          '<a href="https://www.isomer.gov.sg">Cell copy</a>',
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
      title: "The Cancer Drug List (CDL)",
    },
  }),
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement)

    const searchElem = screen.getByRole("searchbox", {
      name: /Search table/iu,
    })

    await expect(searchElem).toHaveAttribute(
      "placeholder",
      "Enter a search term",
    )

    await userEvent.type(searchElem, "some whacky search term")

    await waitFor(() => {
      screen.getByText(
        "Check if you have a spelling error or try a different search term.",
      )
    })
  },
}

export const DGSSearchableTable: Story = {
  args: generateArgs({
    database: {
      dataSource: {
        resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
        type: "dgs",
      },
      title: "Sample DGS Table",
    },
  }),
  name: "DGS Searchable Table",
}

export const DGSSearchableTableWithDefaultTitle: Story = {
  args: generateArgs({
    database: {
      dataSource: {
        resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
        type: "dgs",
      },
    },
  }),
  name: "DGS Searchable Table (with default title)",
}

export const DGSSearchableTableWithHeaders: Story = {
  args: generateArgs({
    database: {
      dataSource: {
        resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
        type: "dgs",
      },
      headers: [
        { key: "year", label: "Year" },
        { key: "university", label: "University" },
        { key: "school", label: "School" },
        { key: "degree", label: "Degree" },
        { key: "gross_monthly_median", label: "Monthly Median" },
      ],
      title: "Sample DGS Table",
    },
  }),
  name: "DGS Searchable Table (with headers)",
}

export const DGSSearchableTableWithFilters: Story = {
  args: generateArgs({
    database: {
      dataSource: {
        filters: [{ fieldKey: "year", fieldValue: "2022" }],
        resourceId: DGS_SMALL_DATASET_RESOURCE_ID,
        type: "dgs",
      },
      title: "Graduate Employment by Year",
    },
  }),
  name: "DGS Searchable Table (with column filters)",
}
