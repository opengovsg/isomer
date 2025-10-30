import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { generateSiteConfig } from "~/stories/helpers"
import Paragraph from "./Paragraph"

const meta: Meta<typeof Paragraph> = {
  title: "Next/Components/Paragraph",
  component: Paragraph,
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
type Story = StoryObj<typeof Paragraph>

export const Default: Story = {
  args: {
    content: [
      {
        type: "text",
        text: "This is a paragraph of text. It can contain ",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              target: "_blank",
            },
          },
        ],
        text: "external links",
      },
      {
        type: "text",
        text: " (and ",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "/contact",
              target: "_blank",
            },
          },
        ],
        text: "internal ones",
      },
      {
        type: "text",
        text: "), ",
      },
      {
        type: "text",
        marks: [
          {
            type: "code",
          },
        ],
        text: "code",
      },
      {
        type: "text",
        text: ", and line breaks. We can also use ",
      },
      {
        type: "text",
        marks: [
          {
            type: "subscript",
          },
        ],
        text: "subscript",
      },
      {
        type: "text",
        text: " and ",
      },
      {
        type: "text",
        marks: [
          {
            type: "superscript",
          },
        ],
        text: "superscript",
      },
      {
        type: "text",
        text: " text.",
      },
    ],
  },
}

export const Simple: Story = {
  args: {
    content: [
      {
        type: "text",
        text: "This is a simple paragraph",
      },
    ],
  },
}

export const Combined: Story = {
  args: {
    content: [
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
        ],
        text: "Create customised ",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
          {
            type: "superscript",
          },
          {
            type: "italic",
          },
        ],
        text: "business",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
          {
            type: "italic",
          },
        ],
        text: "custom",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google.com",
              target: "_blank",
            },
          },
        ],
        text: " solutions for growth",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://www.google2.com",
              target: "_blank",
            },
          },
        ],
        text: " Another link",
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
        type: "text",
        text: "نص لوريم إيبسوم القياسي والمستخدم ltr منذ القرن الخامس عشر",
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
        type: "text",
        text: "نص لوريم إيبسوم القياسي والمستخدم rtl منذ القرن الخامس عشر",
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
        type: "text",
        text: "نص لوريم إيبسوم القياسي والمستخدم auto منذ القرن الخامس عشر",
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
        type: "text",
        text: "نص لوريم إيبسوم القياسي والمستخدم null منذ القرن الخامس عشر",
      },
    ],
  },
}

// Mobile link hard break should not trigger 24px touch target violation
export const MobileLinkHardBreak: Story = {
  args: {
    content: [
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://example.com/first-link",
              target: "_blank",
            },
          },
        ],
        text: "First Link",
      },
      {
        type: "hardBreak",
      },
      {
        type: "text",
        marks: [
          {
            type: "link",
            attrs: {
              href: "https://example.com/second-link",
              target: "_blank",
            },
          },
        ],
        text: "Second Link",
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
    await expect(parseFloat(firstLinkStyle.lineHeight)).toBeGreaterThanOrEqual(
      24,
    )
    await expect(parseFloat(secondLinkStyle.lineHeight)).toBeGreaterThanOrEqual(
      24,
    )
  },
}
