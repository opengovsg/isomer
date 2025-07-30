import type { Meta, StoryObj } from "@storybook/react"

import type { ImageProps } from "~/interfaces"
import { Image } from "./Image"
import { generateSiteConfig } from ".storybook/helpers"

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
    site: generateSiteConfig(),
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
