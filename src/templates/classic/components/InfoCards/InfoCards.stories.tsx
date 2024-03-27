import type { Meta, StoryFn } from "@storybook/react"
import InfoCards from "./InfoCards"
import type { InfoCardsProps } from "~/common"

export default {
  title: "Classic/Components/InfoCards",
  component: InfoCards,
  argTypes: {
    // Define the prop types and control options here
    imageUrl: { control: "text" },
    title: { control: "text" },
    text: { control: "text" },
  },
  parameters: {
    themes: {
      themeOverride: "Isomer Classic",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<InfoCardsProps> = (args) => <InfoCards {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
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
}

// Custom scenario
export const CustomCard = Template.bind({})
CustomCard.args = {
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
}
