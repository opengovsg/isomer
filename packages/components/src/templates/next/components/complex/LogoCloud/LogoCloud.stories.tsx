import type { Meta, StoryObj } from "@storybook/react"

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
  },
}

export const ManyImages: Story = {
  args: {
    images: Array(10).fill(IMAGE),
    site: generateSiteConfig(),
  },
}

export const Agency: Story = {
  args: {
    images: [
      {
        alt: "Some image",
        src: "https://www.ncss.gov.sg/images/default-source/asset/fwdsg_logo.png?sfvrsn=91b23ea8_1",
      },
      {
        alt: "Some image",
        src: "https://www.ncss.gov.sg/images/default-source/asset/togsgcares_logo.png?sfvrsn=d499b7ea_2",
      },
      {
        alt: "Some image",
        src: "https://www.ncss.gov.sg/images/default-source/asset/celebrating-volunteers-logo.png?sfvrsn=44b85185_2 ",
      },
    ],
    site: generateSiteConfig(),
  },
}

export const HugeHorizontalLogo: Story = {
  args: {
    images: [...Array(4).fill(IMAGE), HORIZONTAL_IMAGE],
    site: generateSiteConfig(),
  },
}

export const HugeVerticalLogo: Story = {
  args: {
    images: [...Array(4).fill(IMAGE), VERTICAL_IMAGE],
    site: generateSiteConfig(),
  },
}
