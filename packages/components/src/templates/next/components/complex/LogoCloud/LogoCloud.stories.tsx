import type { Meta, StoryObj } from "@storybook/react-vite"

import type { IsomerSiteProps } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"
import { LogoCloud } from "./LogoCloud"

const meta: Meta<typeof LogoCloud> = {
  title: "Next/Components/Logo Cloud",
  component: LogoCloud,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof LogoCloud>

const IMAGE = { src: "https://placehold.co/150", alt: "placeholder" }
const HORIZONTAL_IMAGE = {
  src: "https://placehold.co/1000x100",
  alt: "placeholder",
}
const VERTICAL_IMAGE = {
  src: "https://placehold.co/100x1000",
  alt: "placeholder",
}

// Default scenario
export const Default: Story = {
  args: {
    images: [IMAGE],
    site: generateSiteConfig(),
    title: "Our partners",
  },
}

export const ManyImages: Story = {
  args: {
    images: Array(10).fill(IMAGE),
    site: generateSiteConfig(),
    title: "Our partners and accolades",
  },
}

export const LongTitle: Story = {
  args: {
    images: Array(5).fill(IMAGE),
    site: generateSiteConfig(),
    title: "Our agency partners that have joined us on our journey since 2019",
  },
}

export const Greyscale: Story = {
  args: {
    images: [
      {
        src: "https://isomer-user-content.by.gov.sg/16/25863c2f-61e7-4d54-bb36-e7cfa1490b64/ogp-logo.svg",
        alt: "open government products logo",
      },
      {
        src: "https://isomer-user-content.by.gov.sg/85/06d6b95f-fc6b-418d-8b08-9efa88790822/GovTech%20Inline%20Logo_V3_no%20bg.gif",
        alt: "govtech logo",
      },
      {
        src: "https://isomer-user-content.by.gov.sg/1/713bc29a-4ba6-4e17-b3a0-43b5a88a4572/stb-logo.svg",
        alt: "singapore tourism board logo",
      },
    ],
    site: generateSiteConfig(),
    title: "Our partners",
    variant: "greyscale",
  },
}

export const Agency: Story = {
  args: {
    title: "Our partners",
    images: [
      {
        src: "https://isomer-user-content.by.gov.sg/16/25863c2f-61e7-4d54-bb36-e7cfa1490b64/ogp-logo.svg",
        alt: "open government products logo",
      },
      {
        src: "https://isomer-user-content.by.gov.sg/85/06d6b95f-fc6b-418d-8b08-9efa88790822/GovTech%20Inline%20Logo_V3_no%20bg.gif",
        alt: "govtech logo",
      },
      {
        src: "https://isomer-user-content.by.gov.sg/1/713bc29a-4ba6-4e17-b3a0-43b5a88a4572/stb-logo.svg",
        alt: "singapore tourism board logo",
      },
    ],
    site: generateSiteConfig(),
  },
}

export const HugeHorizontalLogo: Story = {
  args: {
    title: "Our partners",
    images: [...Array(4).fill(IMAGE), HORIZONTAL_IMAGE],
    site: generateSiteConfig(),
  },
}

export const HugeVerticalLogo: Story = {
  args: {
    title: "Our partners",
    images: [...Array(4).fill(IMAGE), VERTICAL_IMAGE],
    site: generateSiteConfig(),
  },
}
