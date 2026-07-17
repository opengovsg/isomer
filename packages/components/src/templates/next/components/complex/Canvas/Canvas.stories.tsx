import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CanvasProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Canvas } from "./Canvas"

const meta: Meta<CanvasProps> = {
  title: "Next/Components/Canvas",
  component: Canvas,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    layout: "content",
    site: generateSiteConfig(),
    permalink: "/canvas",
  },
}
export default meta
type Story = StoryObj<typeof Canvas>

export const Default: Story = {
  args: {
    blocks: [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The canvas groups other components inside a resizable container. Drag the handle at the bottom-right corner to resize it.",
              },
            ],
          },
        ],
      },
      {
        type: "image",
        src: "https://placehold.co/600x200",
        alt: "Placeholder image inside a canvas",
      },
      {
        type: "callout",
        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Callouts, accordions, statistics and more can be nested inside a canvas.",
                },
              ],
            },
          ],
        },
      },
    ],
  },
}

export const FixedSize: Story = {
  args: {
    width: 60,
    height: 320,
    blocks: [
      {
        type: "keystatistics",
        title: "Key statistics inside a fixed-size canvas",
        statistics: [
          { label: "Average all nighters pulled in a semester", value: "3" },
          { label: "Projects completed", value: "24" },
          { label: "Happy students", value: "100%" },
        ],
      },
      {
        type: "blockquote",
        quote:
          "Content that overflows the fixed height scrolls within the canvas.",
        source: "Isomer Next",
      },
    ],
  },
}

export const GridLayout: Story = {
  args: {
    blocks: [
      {
        type: "prose",
        colStart: 1,
        colSpan: 7,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Blocks can be placed on a 12-column grid: this text spans columns 1-7 while the image beside it spans columns 8-12.",
              },
            ],
          },
        ],
      },
      {
        type: "image",
        colStart: 8,
        colSpan: 5,
        src: "https://placehold.co/400x200",
        alt: "Image placed beside the text on the canvas grid",
      },
      {
        type: "blockquote",
        colStart: 3,
        colSpan: 8,
        rowStart: 4,
        rowSpan: 3,
        quote:
          "Row placement works too: this quote starts on row 4 and is three rows tall.",
        source: "Isomer Next",
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    blocks: [],
  },
}
