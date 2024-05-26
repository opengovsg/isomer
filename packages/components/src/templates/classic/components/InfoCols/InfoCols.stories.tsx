import { Meta, StoryFn } from "@storybook/react"
import InfoCols from "./InfoCols"
import type { InfoColsProps } from "~/interfaces"

export default {
  title: "Classic/Components/InfoCols",
  component: InfoCols,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<InfoColsProps> = (args) => <InfoCols {...args} />

// Default in CMS is 3 infoboxes
export const Default = Template.bind({})
Default.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
  ],
}

export const GrayBackground = Template.bind({})
GrayBackground.args = {
  sectionIdx: 1,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
  ],
}

export const NoButton = Template.bind({})
NoButton.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  infoBoxes: [
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
  ],
}

export const OneInfoBox = Template.bind({})
OneInfoBox.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Infobox title",
      description: "Infobox description",
    },
  ],
}

export const TwoInfoBoxes = Template.bind({})
TwoInfoBoxes.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
  ],
}

export const ThreeInfoBoxesLongText = Template.bind({})
ThreeInfoBoxesLongText.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Long title that should wrap to the next line",
      description: "Long description that should wrap to the next line",
    },
    {
      title: "Long title that should wrap to the next line",
      description: "Long description that should wrap to the next line",
    },
    {
      title: "Long title that should wrap to the next line",
      description: "Long description that should wrap to the next line",
    },
  ],
}

export const FourInfoBoxes = Template.bind({})
FourInfoBoxes.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
    {
      title: "Infobox title",
      description: "Infobox description",
    },
  ],
}

export const FourInfoBoxesLongText = Template.bind({})
FourInfoBoxesLongText.args = {
  sectionIdx: 0,
  title: "Infobar title",
  subtitle: "subtitle",
  buttonLabel: "Button text",
  buttonUrl: "https://google.com",
  infoBoxes: [
    {
      title: "Long title that should wrap to the next line",
      description:
        "Long description that should wrap to the next line. Long description that should wrap to the next line",
    },
    {
      title: "Long title that should wrap to the next line",
      description:
        "Long description that should wrap to the next line. Long description that should wrap to the next line",
    },
    {
      title: "Long title that should wrap to the next line",
      description:
        "Long description that should wrap to the next line. Long description that should wrap to the next line",
    },
    {
      title: "Long title that should wrap to the next line",
      description:
        "Long description that should wrap to the next line. Long description that should wrap to the next line",
    },
  ],
}
