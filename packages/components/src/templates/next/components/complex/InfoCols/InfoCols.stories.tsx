import type { Meta, StoryObj } from "@storybook/react"

import type { InfoColsProps } from "~/interfaces"
import InfoCols from "./InfoCols"

const meta: Meta<InfoColsProps> = {
  title: "Next/Components/InfoCols",
  component: InfoCols,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  args: {
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [],
      },
      theme: "isomer-next",
      isGovernment: true,
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      assetsBaseUrl: "https://cms.isomer.gov.sg",
      navBarItems: [],
      footerItems: {
        privacyStatementLink: "https://www.isomer.gov.sg/privacy",
        termsOfUseLink: "https://www.isomer.gov.sg/terms",
        siteNavItems: [],
      },
      search: {
        type: "localSearch",
        searchUrl: "/search",
      },
    },
  },
}
export default meta
type Story = StoryObj<InfoColsProps>

// Setting this as default for now since it's what has been through the most design work
export const Default: Story = {
  args: {
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
  },
}

export const FourInfoBoxes: Story = {
  args: {
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
  },
}

export const HoverBehaviour: Story = {
  args: {
    sectionIdx: 0,
    title: "Highlights",
    subtitle: "Some of the things that we are working on",
    infoBoxes: [
      {
        title: "Has Link",
        description: "Should change appearance on hover",
        icon: "bar-chart",
        buttonUrl: "/faq",
        buttonLabel: "Read article",
      },
      {
        title: "No Link",
        description: "Should NOT change appearance on hover",
        icon: "bar-chart",
      },
    ],
  },
}
