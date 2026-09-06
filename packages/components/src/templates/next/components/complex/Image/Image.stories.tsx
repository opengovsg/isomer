import type { Meta, StoryObj } from "@storybook/react-vite"
import type { ImageProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Image } from "./Image"

const meta: Meta<ImageProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Image,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Components/Image",
}
export default meta
type Story = StoryObj<typeof Image>

// Default scenario
export const Default: Story = {
  args: {
    alt: "alt",
    src: "https://placehold.co/200x200",
  },
}

export const Smaller: Story = {
  args: {
    alt: "alt",
    size: "smaller",
    src: "https://placehold.co/200x200",
  },
}

export const InvalidImage: Story = {
  args: {
    alt: "alt",
    src: "/invalid-image",
  },
}

export const ImageWithCaption: Story = {
  args: {
    alt: "alt",
    caption:
      "Good collaboration in product development can be critical. Good collaboration in product development can be critical. Good collaboration in product development can be critical. Good collaboration in product development can be critical.",
    src: "https://placehold.co/200x200",
  },
}

export const ImageWithLongCaption: Story = {
  args: {
    alt: "alt",
    caption:
      "One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections. The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved about helplessly as he looked. What's happened to me? he though",
    src: "https://placehold.co/200x200",
  },
}
