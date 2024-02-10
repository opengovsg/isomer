import { Story, Meta } from "@storybook/react"
import Header, { HeaderProps } from "./Header"

export default {
  title: "Isomer/Header",
  component: Header,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<HeaderProps> = (args) => <Header {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  title: "Header section",
  breadcrumbs: [
    {
      name: "Home",
      href: "https://google.com",
    },
    {
      name: "About",
      href: "https://google.com",
    },
    {
      name: "Contact",
      href: "https://google.com",
    },
  ],
}
