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
