import type { Meta, StoryObj } from "@storybook/react-vite"
import type { InfoColsProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { InfoCols } from "./InfoCols"

const meta: Meta<InfoColsProps> = {
  argTypes: {},
  args: {
    headingLevel: 2,
    site: generateSiteConfig(),
  },
  component: InfoCols,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/InfoCols",
}
export default meta
type Story = StoryObj<InfoColsProps>

// Setting this as default for now since it's what has been through the most design work
export const Default: Story = {
  args: {
    infoBoxes: [
      {
        buttonLabel: "Our plan",
        buttonUrl: "/faq",
        description: "Building a Vibrant Economy, Nurturing Enterprises",
        icon: "bar-chart",
        title: "Committee of Supply (COS) 2023",
      },
      {
        buttonLabel: "Learn about scheme",
        buttonUrl: "https://google.com",
        description:
          "Supporting businesses that contribute to Singapore's strategic economic priorities.",
        icon: "line-chart",
        title:
          "Launch of the Manpower for Strategic Economic Priorities (M-SEP) scheme to support firms’ expansion plans",
      },
      {
        buttonLabel:
          "Multilateral collaborations to strengthen regional cooperation and build capabilities.",
        buttonUrl: "/faq",
        description:
          "Multilateral collaborations to strengthen regional cooperation and build capabilities. Multilateral collaborations to strengthen regional cooperation and build capabilities.",
        icon: "users",
        title: "Partnerships",
      },
      {
        buttonLabel: "About the agreement",
        buttonUrl: "https://google.com",
        description:
          "Digital trade rules and digital economy collaborations between two or more economies.",
        icon: "globe",
        title: "Digital Economy Agreements",
      },
      {
        buttonLabel: "See how we can help",
        buttonUrl: "/faq",
        description: "23 roadmaps to drive industry transformation",
        icon: "stars",
        title: "Industry Transformation Maps",
      },
      {
        buttonLabel: "Get support",
        buttonUrl: "https://google.com",
        description:
          "A pro-enterprise environment that facilitates the growth of businesses",
        icon: "office-building",
        title: "Pro-Enterprise Panel (PEP)",
      },
    ],
    sectionIdx: 0,
    subtitle:
      "These are some of the things we are working on. As a ministry, we focus on delivering value to the members of public.",
    title: "MTI Highlights",
  },
}

export const FourInfoBoxes: Story = {
  args: {
    infoBoxes: [
      {
        buttonLabel: "Read article",
        buttonUrl: "/faq",
        description: "Building a Vibrant Economy, Nurturing Enterprises",
        icon: "bar-chart",
        title: "Committee of Supply (COS) 2023",
      },
      {
        buttonLabel: "Read article",
        buttonUrl: "https://google.com",
        description: "Building a Vibrant Economy, Nurturing Enterprises",
        icon: "bar-chart",
        title: "Committee of Supply (COS) 2023",
      },
      {
        buttonLabel: "Read article",
        buttonUrl: "/faq",
        description: "Building a Vibrant Economy, Nurturing Enterprises",
        icon: "bar-chart",
        title: "Committee of Supply (COS) 2023",
      },
      {
        buttonLabel: "Read article",
        buttonUrl: "https://google.com",
        description: "Building a Vibrant Economy, Nurturing Enterprises",
        icon: "bar-chart",
        title: "Committee of Supply (COS) 2023",
      },
    ],
    sectionIdx: 0,
    subtitle: "Some of the things that we are working on",
    title: "Highlights",
  },
}

export const HoverBehaviour: Story = {
  args: {
    infoBoxes: [
      {
        buttonLabel: "Read article",
        buttonUrl: "/faq",
        description: "Should change appearance on hover",
        icon: "bar-chart",
        title: "Has Link",
      },
      {
        description: "Should NOT change appearance on hover",
        icon: "bar-chart",
        title: "No Link",
      },
      {
        buttonUrl: "/faq",
        description: "Should show the arrow beside the title, not below",
        icon: "bar-chart",
        title: "Has Link, No Label, Has Description",
      },
      {
        buttonUrl: "/faq",
        icon: "bar-chart",
        title: "Has Link, No Label, No Description",
      },
    ],
    sectionIdx: 0,
    subtitle: "Some of the things that we are working on",
    title: "Highlights",
  },
}
