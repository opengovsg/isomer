import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CalloutProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Callout } from "./Callout"

const meta: Meta<CalloutProps> = {
  title: "Next/Components/Callout",
  component: Callout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Callout>

// Default scenario
export const Default: Story = {
  args: {
    site: generateSiteConfig(),
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
}

export const UnorderedListFirst: Story = {
  args: {
    site: generateSiteConfig(),
    content: {
      type: "prose",
      content: [
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
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
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
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts.",
            },
          ],
        },
      ],
    },
  },
}

export const UnorderedListOnly: Story = {
  args: {
    site: generateSiteConfig(),
    content: {
      type: "prose",
      content: [
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
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

export const OrderedListFirst: Story = {
  args: {
    site: generateSiteConfig(),
    content: {
      type: "prose",
      content: [
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
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
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
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts.",
            },
          ],
        },
      ],
    },
  },
}

export const OrderedListOnly: Story = {
  args: {
    site: generateSiteConfig(),
    content: {
      type: "prose",
      content: [
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
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
}

export const ListInMiddle: Story = {
  args: {
    site: generateSiteConfig(),
    content: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts.",
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
                      text: "Feeds on grasses, leaves, and shoots.",
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
                      text: "Uses its horn for defence and foraging.",
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
              text: "They are herbivorous mammals and one of the oldest groups of mammals still in existence.",
            },
          ],
        },
      ],
    },
  },
}
