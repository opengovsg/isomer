import { Meta, StoryFn } from "@storybook/react"
import InfoCols from "./InfoCols"
import type { InfoColsProps } from "~/interfaces"

export default {
  title: "Next/Components/InfoCols",
  component: InfoCols,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<InfoColsProps> = (args) => <InfoCols {...args} />

// Setting this as default for now since it's what has been through the most design work
export const Default = Template.bind({})
Default.args = {
  sectionIdx: 0,
  title: "Highlights",
  subtitle: "Some of the things that we are working on",
  infoBoxes: [
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
  ],
}

export const GrayBackground = Template.bind({})
GrayBackground.args = {
  sectionIdx: 1,
  backgroundColor: "gray",
  title: "Highlights",
  subtitle: "Some of the things that we are working on",
  infoBoxes: [
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
  ],
}

export const FourInfoBoxes = Template.bind({})
FourInfoBoxes.args = {
  sectionIdx: 0,
  title: "Highlights",
  subtitle: "Some of the things that we are working on",
  infoBoxes: [
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Read article",
      buttonUrl: "https://google.com",
      icon: "bar-chart",
    },
  ],
}
