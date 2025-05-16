import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { InfopicProps } from "~/interfaces"
import { Infopic } from "../Infopic"

const meta: Meta<InfopicProps> = {
  title: "Next/Components/Infopic/Full",
  component: Infopic,
  argTypes: {},
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
    chromatic: {
      ...withChromaticModes(["desktop", "mobile"]),
    },
  },
  args: {
    variant: "full",
    title:
      "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
    description:
      "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
    imageAlt:
      "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
    imageSrc:
      "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
    buttonLabel: "Sign up",
    buttonUrl: "/",
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
      navbar: { items: [] },
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
type Story = StoryObj<typeof Infopic>

// Default scenario
export const Default: Story = {}

export const TextOnRight: Story = {
  args: {
    isTextOnRight: true,
  },
}

export const NoButton: Story = {
  args: {
    buttonUrl: "",
  },
}

export const TallImage: Story = {
  args: {
    buttonUrl: "",
    description: "",
    imageSrc:
      "https://images.unsplash.com/photo-1724390495674-5f28d72c686f?q=80&w=2500&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
}

export const LongImage: Story = {
  args: {
    title: "Don't put all your baskets in one egg",
    description: "",
    buttonUrl: "",
    imageSrc:
      "https://images.unsplash.com/photo-1444858440655-e7cf0269024e?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
}

export const LongImageWithDesc: Story = {
  args: {
    title: "Don't put all your baskets in one egg",
    imageSrc:
      "https://images.unsplash.com/photo-1713098372674-cbf10e8c2bba?q=80&w=3869&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
}
