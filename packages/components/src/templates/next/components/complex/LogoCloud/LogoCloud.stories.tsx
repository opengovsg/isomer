import type { Meta, StoryObj } from "@storybook/react-vite"
import type { IsomerSiteProps } from "~/types"
import { generateSiteConfig } from "~/stories/helpers"

import { LogoCloud } from "./LogoCloud"

const meta: Meta<typeof LogoCloud> = {
  argTypes: {},
  component: LogoCloud,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Logo Cloud",
}
export default meta
type Story = StoryObj<typeof LogoCloud>

const IMAGE = { alt: "placeholder", src: "https://placehold.co/150" }
const HORIZONTAL_IMAGE = {
  alt: "placeholder",
  src: "https://placehold.co/1000x100",
}
const VERTICAL_IMAGE = {
  alt: "placeholder",
  src: "https://placehold.co/100x1000",
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
    images: [...Array(4).fill(IMAGE), HORIZONTAL_IMAGE],
    site: generateSiteConfig(),
    title: "Our partners",
  },
}

export const HugeVerticalLogo: Story = {
  args: {
    images: [...Array(4).fill(IMAGE), VERTICAL_IMAGE],
    site: generateSiteConfig(),
    title: "Our partners",
  },
}
