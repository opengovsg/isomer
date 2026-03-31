import type { Meta, StoryObj } from "@storybook/react-vite"

import Infobar from "./Infobar"

const meta: Meta<typeof Infobar> = {
  title: "Classic/Components/Infobar",
  component: Infobar,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof Infobar>

// Default scenario
export const Default: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    subtitle: "subtitle",
    description: "About a sentence worth of description here",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
  },
}

export const GrayBackground: Story = {
  args: {
    sectionIdx: 1,
    title: "Infobar title",
    subtitle: "subtitle",
    description: "About a sentence worth of description here",
    buttonLabel: "Button text",
    buttonUrl: "https://google.com",
  },
}

export const TitleAndDescriptionOnly: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title",
    description: "About a sentence worth of description here",
  },
}

export const LongText: Story = {
  args: {
    sectionIdx: 0,
    title: "Infobar title Infobar title Infobar title",
    subtitle: "subtitle subtitle subtitle subtitle subtitle subtitle",
    description:
      "About a sentence worth of description here About a sentence worth of description here About a sentence worth of description here",
    buttonLabel: "Button text button text button text",
    buttonUrl: "https://google.com",
  },
}
