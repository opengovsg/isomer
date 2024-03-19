import { Meta, StoryFn } from "@storybook/react"
import TableOfContents from "./TableOfContents"
import { TableOfContentsProps } from "~/common"

export default {
  title: "Next/Components/TableOfContents",
  component: TableOfContents,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<TableOfContentsProps> = (args) => (
  <TableOfContents {...args} />
)

// Default scenario
export const Default = Template.bind({})
Default.args = {
  items: [
    {
      content: "What does the New Idea Scheme proposal support?",
      anchorLink: "#introduction",
      level: 1,
    },
    {
      content: "What does the New Idea Scheme proposal support?",
      anchorLink: "#first-paragraph",
      level: 1,
    },
    {
      content: "Something else",
      anchorLink: "#second-paragraph",
      level: 1,
    },
  ],
}
