import { Story, Meta } from "@storybook/react"
import Search, { SearchProps } from "./Search"

export default {
  title: "Isomer/Search",
  component: Search,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<SearchProps> = (args) => <Search {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  index: [],
}
