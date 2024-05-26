import { Meta, StoryFn } from "@storybook/react"
import Infobar from "./Infobar"
import { InfobarProps } from "~/interfaces"

export default {
  title: "Next/Components/Infobar",
  component: Infobar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<InfobarProps> = (args) => <Infobar {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  sectionIdx: 0,
  title: "This is a place where you can put nice content",
  description: "About a sentence worth of description here",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://google.com",
  secondaryButtonLabel: "Secondary CTA",
  secondaryButtonUrl: "https://google.com",
}

export const OneButton = Template.bind({})
OneButton.args = {
  sectionIdx: 0,
  title: "This is a place where you can put nice content",
  description: "About a sentence worth of description here",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://google.com",
}

export const LongText = Template.bind({})
LongText.args = {
  sectionIdx: 0,
  title:
    "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
  description:
    "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
  buttonLabel: "Primary CTA",
  buttonUrl: "https://google.com",
  secondaryButtonLabel: "Secondary CTA",
  secondaryButtonUrl: "https://google.com",
}
