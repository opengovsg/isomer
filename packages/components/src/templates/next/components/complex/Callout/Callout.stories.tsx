import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CalloutProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Callout } from "./Callout"

const meta: Meta<CalloutProps> = {
  argTypes: {},
  component: Callout,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Callout",
}
export default meta
type Story = StoryObj<typeof Callout>

const content: CalloutProps["content"] = {
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
}

// Default scenario
export const Default: Story = {
  args: {
    content,
    headingLevel: 2,
    site: generateSiteConfig(),
  },
}

// Legacy variant value, kept for backward compatibility with content saved
// before "info" was renamed to "information".
export const Info: Story = {
  args: {
    content,
    headingLevel: 2,
    site: generateSiteConfig(),
    variant: "info",
  },
}

export const GoodToKnow: Story = {
  args: {
    content,
    headingLevel: 2,
    site: generateSiteConfig(),
    variant: "goodToKnow",
  },
}

export const Warning: Story = {
  args: {
    content,
    headingLevel: 2,
    site: generateSiteConfig(),
    variant: "warning",
  },
}

export const Urgent: Story = {
  args: {
    content,
    headingLevel: 2,
    site: generateSiteConfig(),
    variant: "urgent",
  },
}

export const Note: Story = {
  args: {
    content,
    headingLevel: 2,
    site: generateSiteConfig(),
    variant: "note",
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
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    headingLevel: 2,
    site: generateSiteConfig(),
  },
}

export const UnorderedListOnly: Story = {
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
      ],
      type: "prose",
    },
    headingLevel: 2,
    site: generateSiteConfig(),
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
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    headingLevel: 2,
    site: generateSiteConfig(),
  },
}

export const OrderedListOnly: Story = {
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
      ],
      type: "prose",
    },
    headingLevel: 2,
    site: generateSiteConfig(),
  },
}

export const ListInMiddle: Story = {
  args: {
    content: {
      content: [
        {
          content: [
            {
              text: "Rhinos are large, sturdy mammals known for their thick, protective skin and one or two horns on their snouts.",
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
              text: "They are herbivorous mammals and one of the oldest groups of mammals still in existence.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    headingLevel: 2,
    site: generateSiteConfig(),
  },
}
