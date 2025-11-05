import type { Meta, StoryObj } from "@storybook/react-vite"

import type { TableOfContentsProps } from "~/interfaces"
import TableOfContents from "./TableOfContents"

const meta: Meta<TableOfContentsProps> = {
  title: "Next/Internal Components/TableOfContents",
  component: TableOfContents,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof TableOfContents>

// Default scenario
export const Default: Story = {
  args: {
    items: [
      {
        content: "What does the New Idea Scheme proposal support?",
        anchorLink: "#introduction",
      },
      {
        content: "What does the New Idea Scheme proposal support?",
        anchorLink: "#first-paragraph",
      },
      {
        content: "Something else",
        anchorLink: "#second-paragraph",
      },
    ],
  },
}
