import type { Meta, StoryObj } from "@storybook/react"

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
              rel: "noreferrer",
              class: "",
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
              rel: "noreferrer",
              class: "",
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
