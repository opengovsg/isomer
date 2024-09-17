import type { Meta, StoryObj } from "@storybook/react"

import type { ImageProps } from "~/interfaces"
import { Image } from "./Image"

const meta: Meta<ImageProps> = {
  title: "Next/Components/Image",
  component: Image,
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
type Story = StoryObj<typeof Image>

// Default scenario
export const Default: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
  },
}

export const Smaller: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
    size: "smaller",
  },
}

export const ImageWithExternalLink: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
    href: "https://www.google.com",
  },
}

export const ImageWithInternalLink: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
    href: "[resource:1:1]",
  },
}

export const InvalidImage: Story = {
  args: {
    src: "/invalid-image",
    alt: "alt",
  },
}

export const ImageWithCaption: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
    caption:
      "Good collaboration in product development can be critical. Good collaboration in product development can be critical. Good collaboration in product development can be critical. Good collaboration in product development can be critical.",
  },
}
