import type { Meta, StoryObj } from "@storybook/react"

import type { InfoCardsProps } from "~/interfaces"
import InfoCards from "./InfoCards"

const meta: Meta<InfoCardsProps> = {
  title: "Classic/Components/InfoCards",
  component: InfoCards,
  argTypes: {
    title: { control: "text" },
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
}
export default meta
type Story = StoryObj<typeof InfoCards>

// Default scenario
export const Default: Story = {
  args: {
    sectionIdx: 0,
    cards: [
      {
        imageUrl: "https://placehold.co/200x300",
        imageAlt: "alt text",
        title: "Default Title",
        description: "Default text here.",
        url: "https://www.google.com",
      },
      {
        imageUrl: "https://placehold.co/200x300",
        imageAlt: "alt text",
        title: "Default Title",
        description: "Default text here.",
        url: "/",
      },
    ],
  },
}

// Custom scenario
export const CustomCard: Story = {
  args: {
    sectionIdx: 1,
    cards: [
      {
        imageUrl: "https://placehold.co/200x300",
        imageAlt: "alt text",
        title: "Custom Title",
        description: "Custom text here.",
        url: "https://www.google.com",
      },
    ],
  },
}
