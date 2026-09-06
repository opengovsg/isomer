import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ContentpicProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Contentpic } from "./Contentpic"

const meta: Meta<ContentpicProps> = {
  argTypes: {},
  args: {
    content: {
      content: [
        {
          content: [
            {
              marks: [
                {
                  type: "bold",
                },
              ],
              text: "Professor Rhino Bean",
              type: "text",
            },
            { type: "hardBreak" },
            {
              marks: [
                {
                  type: "bold",
                },
              ],
              text: "Executive Bean",
              type: "text",
            },
          ],
          type: "paragraph",
        },
        {
          content: [
            {
              marks: [],
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
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
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Impressive Size and Strength: ",
                      type: "text",
                    },
                    {
                      text: "Rhinos are among the largest land mammals, with powerful builds that make them formidable in the wild.",
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
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Unique Horns: ",
                      type: "text",
                    },
                    {
                      text: "Their distinctive horns are not only a symbol of their strength but also serve important roles in defense and foraging.",
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
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Ancient Survivors: ",
                      type: "text",
                    },
                    {
                      text: "Rhinos have been around for millions of years, representing a living link to prehistoric times.",
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
                      marks: [
                        {
                          type: "bold",
                        },
                      ],
                      text: "Ecological Impact: ",
                      type: "text",
                    },
                    {
                      text: "Rhinos play a key role in their ecosystems by helping to maintain the balance of vegetation and supporting other wildlife.",
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
              marks: [],
              text: "<a href='https://www.traffic.org/news/singapore-rhino-horn-smuggler-24/'>Singapore court gets tough on rhino horn smuggler</a>",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    headingLevel: 2,
    imageAlt:
      "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
    imageSrc:
      "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
    site: generateSiteConfig(),
  },
  component: Contentpic,
  parameters: {
    chromatic: {
      ...withChromaticModes(["desktop", "tablet", "mobile"]),
    },
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Contentpic",
}
export default meta
type Story = StoryObj<typeof Contentpic>

// Default scenario
export const Default: Story = {}

export const ShortParagraph: Story = {
  args: {
    content: {
      content: [
        {
          content: [
            {
              text: "This is a short paragraph",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
  },
}

export const UnorderedListFirst: Story = {
  args: {
    content: {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [
                    {
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
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
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
  },
}

export const OrderedListFirst: Story = {
  args: {
    content: {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [
                    {
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
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
        {
          content: [
            {
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts. They inhabit parts of Africa and Asia and are primarily herbivores, feeding on grasses, leaves, and shoots. Despite their imposing size and strength, rhinos are endangered due to habitat loss and poaching. Conservation efforts are crucial to ensuring their survival.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
  },
}
