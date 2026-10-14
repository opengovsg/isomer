import type { Meta, StoryObj } from "@storybook/react-vite"
import { userEvent, within } from "storybook/test"
import { generateSiteConfig } from "~/stories/helpers"

import { withChromaticModes } from "@isomer/storybook-config"

import { Accordion } from "./Accordion"

const meta: Meta<typeof Accordion> = {
  title: "Next/Components/Accordion",
  component: Accordion,
  render: ({ summary, ...args }) => {
    return (
      <>
        <Accordion summary={`${summary}1`} {...args} />
        <Accordion summary={`${summary}2`} {...args} />
        <Accordion summary={`${summary}3`} {...args} />
      </>
    )
  },
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    chromatic: withChromaticModes(["desktop", "mobile"]),
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: generateSiteConfig(),
    layout: "content",
    permalink: "/",
    headingLevel: 2,
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

export const Expanded: Story = {
  args: LongContent.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(`${LongContent.args?.summary}2`))
  },
}

export const UnorderedListFirst: Story = {
  args: {
    summary: "Title for accordion item",
    details: {
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
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Enter content for the accordion here." },
          ],
        },
      ],
    },
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
    summary: "Title for accordion item",
    details: {
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
          ],
        },
      ],
    },
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
    summary: "Title for accordion item",
    details: {
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
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Enter content for the accordion here." },
          ],
        },
      ],
    },
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
    summary: "Title for accordion item",
    details: {
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
          ],
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(`${OrderedListOnly.args?.summary}1`))
  },
}

export const ListInMiddle: Story = {
  args: {
    summary: "Title for accordion item",
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
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText(`${ListInMiddle.args?.summary}1`))
  },
}

export const WithContentBlocks: Story = {
  args: {
    summary: "Who is eligible to apply?",
    content: [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Singapore-registered companies, societies and charities can apply. Sole proprietors should apply under the individual track.",
              },
            ],
          },
        ],
      },
      {
        type: "column",
        variant: "oneThirdTwoThirds",
        columns: [
          [
            {
              type: "image",
              src: "https://placehold.co/400x300",
              alt: "Flowchart of the eligibility criteria",
            },
          ],
          [
            {
              type: "prose",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "Follow the chart to check which scheme applies to you before you start your application.",
                    },
                  ],
                },
              ],
            },
          ],
        ],
      },
      {
        type: "infobar",
        title: "Ready to apply?",
        description: "Applications close on 31 December.",
        buttonLabel: "Start your application",
        buttonUrl: "/",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByText(`${WithContentBlocks.args?.summary}1`),
    )
  },
}
