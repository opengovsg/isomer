import type { Meta, StoryFn } from "@storybook/react"
import type { ParagraphProps } from "~/interfaces"
import Paragraph from "./Paragraph"

export default {
  title: "Next/Components/Paragraph",
  component: Paragraph,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<ParagraphProps> = (args) => <Paragraph {...args} />

export const Default = Template.bind({})
Default.args = {
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
          href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
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
          href: "/contact",
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
}

export const Simple = Template.bind({})
Simple.args = {
  content: [
    {
      type: "text",
      text: "This is a simple paragraph",
    },
  ],
}
