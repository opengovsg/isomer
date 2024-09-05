import type { Meta, StoryObj } from "@storybook/react"

import type { InfobarProps } from "~/interfaces"
import Infobar from "./Infobar"

const meta: Meta<InfobarProps> = {
  title: "Next/Components/Infobar",
  component: Infobar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof Infobar>

// Default scenario
export const Default: Story = {
  args: {
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "https://google.com",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "https://google.com",
  },
}

export const OneButton: Story = {
  args: {
    sectionIdx: 0,
    title: "This is a place where you can put nice content",
    description: "About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "https://google.com",
  },
}

export const LongText: Story = {
  args: {
    sectionIdx: 0,
    title:
      "Longer title here that spans multiple lines and is quite long and verbose and takes up a lot of space",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    buttonLabel: "Primary CTA",
    buttonUrl: "https://google.com",
    secondaryButtonLabel: "Secondary CTA",
    secondaryButtonUrl: "https://google.com",
  },
}
