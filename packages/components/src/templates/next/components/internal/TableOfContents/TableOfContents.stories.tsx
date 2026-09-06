import type { Meta, StoryObj } from "@storybook/react-vite"
import type { TableOfContentsProps } from "~/interfaces"

import { TableOfContents } from "./TableOfContents"

const meta: Meta<TableOfContentsProps> = {
  argTypes: {},
  component: TableOfContents,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/TableOfContents",
}
export default meta
type Story = StoryObj<typeof TableOfContents>

// Default scenario
export const Default: Story = {
  args: {
    items: [
      {
        anchorLink: "#introduction",
        content: "What does the New Idea Scheme proposal support?",
      },
      {
        anchorLink: "#first-paragraph",
        content: "What does the New Idea Scheme proposal support?",
      },
      {
        anchorLink: "#second-paragraph",
        content: "Something else",
      },
    ],
  },
}
