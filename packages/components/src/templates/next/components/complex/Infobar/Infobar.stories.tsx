import type { Meta, StoryObj } from "@storybook/react"

import type { InfobarProps } from "~/interfaces"
import Infobar from "./Infobar"

const meta: Meta<InfobarProps> = {
  title: "Next/Components/Infobar",
  component: Infobar,
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
      logoUrl: "/isomer-logo.svg",
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
type Story = StoryObj<typeof Infobar>

// Default scenario
export const Default: Story = {
  args: {
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
  },
}

export const OneButton: Story = {
  args: {
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
  },
}

export const LongText: Story = {
  args: {
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "/",
  },
}

export const NoCTA: Story = {
  args: {
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
  },
}
