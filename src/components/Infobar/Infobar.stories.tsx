import { Story, Meta } from "@storybook/react"
import Infobar, { InfobarProps } from "./Infobar"

export default {
  title: "Isomer/Infobar",
  component: Infobar,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<InfobarProps> = (args) => <Infobar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  description: "About a sentence worth of description here",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
}

export const GrayBackground = Template.bind({})
GrayBackground.args = {
  sectionIdx: 1,
  title: "Infobar title",
  subtitle: "subtitle",
  description: "About a sentence worth of description here",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
}

export const TitleAndDescriptionOnly = Template.bind({})
TitleAndDescriptionOnly.args = {
  sectionIdx: 0,
  title: "Infobar title",
  description: "About a sentence worth of description here",
}

export const LongText = Template.bind({})
LongText.args = {
  sectionIdx: 0,
  title: "Infobar title Infobar title Infobar title",
  subtitle: "subtitle subtitle subtitle subtitle subtitle subtitle",
  description:
    "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
  buttonLabel: "Button text button text button text",
  buttonUrl: "https://google.com",
}
