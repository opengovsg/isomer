import type { Meta, StoryObj } from "@storybook/react-vite"

import type { ImageProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"
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

export const ImageWithLongCaption: Story = {
  args: {
    src: "https://placehold.co/200x200",
    alt: "alt",
    caption:
      "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. What's happened to me? he though",
  },
}
