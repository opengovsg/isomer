import { Story, Meta } from "@storybook/react"
import Navbar, { IsomerNavProps } from "./Navbar"

export default {
  title: "Isomer/Navbar",
  component: Navbar,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<IsomerNavProps> = (args) => <Navbar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  logo: { url: "https://picsum.photos/100/50", alt: "logo" },
  links: [
    {
      type: "single",
      name: "Home",
      eventKey: "home",
      url: "https://google.com",
    },
    {
      type: "dropdown",
      name: "Dropdown",
      eventKey: "dropdown",
      links: [
        {
          type: "single",
          name: "Sublink 1",
          url: "https://google.com",
        },
        {
          type: "single",
          name: "Sublink 2",
          url: "https://google.com",
        },
      ],
    },
  ],
}
