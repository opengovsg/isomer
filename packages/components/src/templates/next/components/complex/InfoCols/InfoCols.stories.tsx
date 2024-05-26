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
  title: "MTI Highlights",
  subtitle:
    "These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
  infoBoxes: [
    {
      title: "Committee of Supply (COS) 2023",
      description: "Building a Vibrant Economy, Nurturing Enterprises",
      buttonLabel: "Our plan",
      buttonUrl: "/faq",
      icon: "bar-chart",
    },
    {
      title:
        "Launch of the Manpower for Strategic Economic Priorities (M-SEP) scheme to support firms’ expansion plans",
      description:
        "Supporting businesses that contribute to Singapore's strategic economic priorities.",
      buttonLabel: "Learn about scheme",
      buttonUrl: "https://google.com",
      icon: "line-chart",
    },
    {
      title: "Partnerships",
      description:
        "Multilateral collaborations to strengthen regional cooperation and build capabilities.",
      buttonLabel: "Read article",
      buttonUrl: "/faq",
      icon: "users",
    },
    {
      title: "Digital Economy Agreements",
      description:
        "Digital trade rules and digital economy collaborations between two or more economies.",
      buttonLabel: "About the agreement",
      buttonUrl: "https://google.com",
      icon: "globe",
    },
    {
      title: "Industry Transformation Maps",
      description: "23 roadmaps to drive industry transformation",
      buttonLabel: "See how we can help",
      buttonUrl: "/faq",
      icon: "stars",
    },
    {
      title: "Pro-Enterprise Panel (PEP)",
      description:
        "A pro-enterprise environment that facilitates the growth of businesses",
      buttonLabel: "Get support",
      buttonUrl: "https://google.com",
      icon: "office-building",
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
