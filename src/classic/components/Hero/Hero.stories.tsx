import type { StoryFn, Meta } from "@storybook/react"
import Hero from "./Hero"
import { HeroProps } from "~/common"

export default {
  title: "Classic/Components/Hero",
  component: Hero,
  argTypes: {},
} as Meta

// Template for stories
const Template: StoryFn<HeroProps> = (args) => <Hero {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {}

// Side layout
export const SideButton = Template.bind({})
SideButton.args = {
  variant: "side",
  backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  alignment: "left",
  backgroundColor: "white",
  size: "md",
  title: "Easily set up good government websites",
  subtitle: "Free, fast, easy",
  buttonLabel: "Find out if I'm a good fit",
  buttonUrl: "/contact",
}

export const SideDropdown = Template.bind({})
SideDropdown.args = {
  variant: "side",
  backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  alignment: "left",
  backgroundColor: "white",
  size: "md",
  title: "Easily set up good government websites",
  subtitle: "Free, fast, easy",
  dropdown: {
    options: [
      {
        title: "Option 1",
        url: "/option-1",
      },
      {
        title: "Option 2",
        url: "/option-2",
      },
      {
        title:
          "Some super long option that it should overflow on small screens",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    ],
  },
}
