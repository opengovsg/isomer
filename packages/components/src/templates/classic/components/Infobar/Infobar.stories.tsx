import type { Meta, StoryFn } from "@storybook/react"
import Infobar from "./Infobar"
import type { InfobarProps } from "~/interfaces"

export default {
  title: "Classic/Components/Infobar",
  component: Infobar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<InfobarProps> = (args) => <Infobar {...args} />

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
