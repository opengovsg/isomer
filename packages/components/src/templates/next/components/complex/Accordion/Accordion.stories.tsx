import type { Meta, StoryObj } from "@storybook/react"

import Accordion from "./Accordion"

const meta: Meta<typeof Accordion> = {
  title: "Next/Components/Accordion",
  component: Accordion,
  render: (args) => {
    return (
      <>
        <Accordion {...args} />
        <Accordion {...args} />
        <Accordion {...args} />
      </>
    )
  },
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Accordion>

export const Basic: Story = {
  args: {
    summary: "Title for accordion item",
    details: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Enter content for the accordion here. Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
            },
          ],
        },
      ],
    },
  },
}

export const LongContent: Story = {
  args: {
    summary:
      "What if I am subject to payment from the Central Repository of Funds but I haven't received the funds yet? What happens then? What if I am subject to payment from the Central Repository of Funds but I haven't received the funds yet? What happens then?",
    details: {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Enter content for the accordion here." },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
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
                  content: [{ type: "text", text: "This is a bullet point" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [
                    { type: "text", text: "This is another bullet point" },
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
                    { type: "text", text: "This is a third bullet point" },
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
