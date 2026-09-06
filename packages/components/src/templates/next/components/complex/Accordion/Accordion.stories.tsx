import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Accordion } from "./Accordion"

const meta: Meta<typeof Accordion> = {
  argTypes: {},
  args: {
    headingLevel: 2,
    site: generateSiteConfig(),
  },
  component: Accordion,
  parameters: {
    chromatic: withChromaticModes(["desktop", "mobile"]),
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  render: ({ summary, ...args }) => (
    <>
      <Accordion summary={`${summary}1`} {...args} />
      <Accordion summary={`${summary}2`} {...args} />
      <Accordion summary={`${summary}3`} {...args} />
    </>
  ),
  title: "Next/Components/Accordion",
}
export default meta
type Story = StoryObj<typeof Accordion>

export const Basic: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            {
              text: "Enter content for the accordion here. Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    summary: "Title for accordion item",
  },
}

export const LongContent: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            { text: "Enter content for the accordion here.", type: "text" },
          ],
          type: "paragraph",
        },
        {
          content: [
            {
              text: "Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
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
                  content: [{ text: "This is a bullet point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [
                    { text: "This is another bullet point", type: "text" },
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
                    { text: "This is a third bullet point", type: "text" },
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
    summary:
      "What if I am subject to payment from the Central Repository of Funds but I haven't received the funds yet? What happens then? What if I am subject to payment from the Central Repository of Funds but I haven't received the funds yet? What happens then?",
  },
}

export const Expanded: Story = {
  args: LongContent.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(`${LongContent.args?.summary}2`))
  },
}

export const UnorderedListFirst: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "This is a bullet point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [
                    { text: "This is another bullet point", type: "text" },
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
            { text: "Enter content for the accordion here.", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    summary: "Title for accordion item",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByText(`${UnorderedListFirst.args?.summary}1`),
    )
  },
}

export const UnorderedListOnly: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "This is a bullet point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [
                    { text: "This is another bullet point", type: "text" },
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
    summary: "Title for accordion item",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByText(`${UnorderedListOnly.args?.summary}1`),
    )
  },
}

export const OrderedListFirst: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "This is a bullet point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [
                    { text: "This is another bullet point", type: "text" },
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
            { text: "Enter content for the accordion here.", type: "text" },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    summary: "Title for accordion item",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByText(`${OrderedListFirst.args?.summary}1`),
    )
  },
}

export const OrderedListOnly: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "This is a bullet point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [
                    { text: "This is another bullet point", type: "text" },
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
    summary: "Title for accordion item",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(`${OrderedListOnly.args?.summary}1`))
  },
}

export const ListInMiddle: Story = {
  args: {
    details: {
      content: [
        {
          content: [
            { text: "Enter content for the accordion here.", type: "text" },
          ],
          type: "paragraph",
        },
        {
          content: [
            {
              content: [
                {
                  content: [{ text: "This is a bullet point", type: "text" }],
                  type: "paragraph",
                },
              ],
              type: "listItem",
            },
            {
              content: [
                {
                  content: [
                    { text: "This is another bullet point", type: "text" },
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
              text: "Accordions hide content by default, so make sure that anything written inside an accordion is not critical information.",
              type: "text",
            },
          ],
          type: "paragraph",
        },
      ],
      type: "prose",
    },
    summary: "Title for accordion item",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(`${ListInMiddle.args?.summary}1`))
  },
}
