import type { Meta, StoryObj } from "@storybook/react"

import { withChromaticModes } from "@isomer/storybook-config"

import type { InfopicProps } from "~/interfaces"
import { Infopic } from "./Infopic"

const meta: Meta<InfopicProps> = {
  title: "Next/Components/Infopic",
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
    title:
      "Explore your great neighbourhood with us can’t stretch all the way so this needs a max width",
    description:
      "They will try to close the door on you, just open it. Lion! The other day the grass was brown, now it’s green because I ain’t give up. Never surrender.",
    imageAlt:
      "Two rhinos. A rhino is peacefully grazing on grass in a field in front of the other rhino.",
    imageSrc:
      "https://images.unsplash.com/photo-1527436826045-8805c615a6df?w=1280",
    buttonLabel: "Sign up",
    buttonUrl: "https://open.gov.sg",
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
