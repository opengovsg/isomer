import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"

import { Paragraph } from "./Paragraph"

const meta: Meta<typeof Paragraph> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Paragraph,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Paragraph",
}
export default meta
type Story = StoryObj<typeof Paragraph>

export const Default: Story = {
  args: {
    content: [
      {
        text: "This is a paragraph of text. It can contain ",
        type: "text",
      },
      {
        marks: [
          {
            attrs: {
              href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: "external links",
        type: "text",
      },
      {
        text: " (and ",
        type: "text",
      },
      {
        marks: [
          {
            attrs: {
              href: "/contact",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: "internal ones",
        type: "text",
      },
      {
        text: "), ",
        type: "text",
      },
      {
        marks: [
          {
            type: "code",
          },
        ],
        text: "code",
        type: "text",
      },
      {
        text: ", and line breaks. We can also use ",
        type: "text",
      },
      {
        marks: [
          {
            type: "subscript",
          },
        ],
        text: "subscript",
        type: "text",
      },
      {
        text: " and ",
        type: "text",
      },
      {
        marks: [
          {
            type: "superscript",
          },
        ],
        text: "superscript",
        type: "text",
      },
      {
        text: " text.",
        type: "text",
      },
    ],
  },
}

export const Simple: Story = {
  args: {
    content: [
      {
        text: "This is a simple paragraph",
        type: "text",
      },
    ],
  },
}

export const Combined: Story = {
  args: {
    content: [
      {
        marks: [
          {
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: "Create customised ",
        type: "text",
      },
      {
        marks: [
          {
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
            type: "link",
          },
          {
            type: "superscript",
          },
          {
            type: "italic",
          },
        ],
        text: "business",
        type: "text",
      },
      {
        marks: [
          {
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
            type: "link",
          },
          {
            type: "italic",
          },
        ],
        text: "custom",
        type: "text",
      },
      {
        marks: [
          {
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: " solutions for growth",
        type: "text",
      },
      {
        marks: [
          {
            attrs: {
              href: "https://www.google2.com",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: " Another link",
        type: "text",
      },
    ],
  },
}

export const WithDirectionLTR: Story = {
  args: {
    attrs: {
      dir: "ltr",
    },
    content: [
      {
        text: "نص لوريم إيبسوم القياسي والمستخدم ltr منذ القرن الخامس عشر",
        type: "text",
      },
    ],
  },
}

export const WithDirectionRTL: Story = {
  args: {
    attrs: {
      dir: "rtl",
    },
    content: [
      {
        text: "نص لوريم إيبسوم القياسي والمستخدم rtl منذ القرن الخامس عشر",
        type: "text",
      },
    ],
  },
}

export const WithDirectionAuto: Story = {
  args: {
    attrs: {
      dir: "auto",
    },
    content: [
      {
        text: "نص لوريم إيبسوم القياسي والمستخدم auto منذ القرن الخامس عشر",
        type: "text",
      },
    ],
  },
}

export const WithDirectionNull: Story = {
  args: {
    attrs: {
      dir: null,
    },
    content: [
      {
        text: "نص لوريم إيبسوم القياسي والمستخدم null منذ القرن الخامس عشر",
        type: "text",
      },
    ],
  },
}

// Mobile link hard break should not trigger 24px touch target violation
export const MobileLinkHardBreak: Story = {
  args: {
    content: [
      {
        marks: [
          {
            attrs: {
              href: "https://example.com/first-link",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: "First Link",
        type: "text",
      },
      {
        type: "hardBreak",
      },
      {
        marks: [
          {
            attrs: {
              href: "https://example.com/second-link",
              target: "_blank",
            },
            type: "link",
          },
        ],
        text: "Second Link",
        type: "text",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const firstLink = await canvas.findByText("First Link")
    const secondLink = await canvas.findByText("Second Link")

    const firstLinkStyle = getComputedStyle(firstLink)
    const secondLinkStyle = getComputedStyle(secondLink)

    // Assert line height for both links (should be at least 24px to meet touch target requirements)
    await expect(
      Number.parseFloat(firstLinkStyle.lineHeight),
    ).toBeGreaterThanOrEqual(24)
    await expect(
      Number.parseFloat(secondLinkStyle.lineHeight),
    ).toBeGreaterThanOrEqual(24)
  },
}
