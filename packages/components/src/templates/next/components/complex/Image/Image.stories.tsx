import type { Meta, StoryObj } from "@storybook/react"

import type { ImageProps } from "~/interfaces"
import Image from "./Image"

const meta: Meta<ImageProps> = {
  title: "Next/Components/Image",
  component: Image,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
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

export const HalfWidth: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
    width: 50,
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
    href: "/faq",
  },
}

export const InvalidImage: Story = {
  args: {
    src: "/invalid-image",
    alt: "alt",
    assetsBaseUrl: "https://cms.isomer.gov.sg",
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
