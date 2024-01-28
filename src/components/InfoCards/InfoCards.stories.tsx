// InfoCards.stories.tsx

import React from "react"
import { Story, Meta } from "@storybook/react"
import { InfoCards, InfoCardsProps } from "./InfoCards"

export default {
  title: "Example/InfoCards",
  component: InfoCards,
  argTypes: {
    // Define the prop types and control options here
    imageUrl: { control: "text" },
    title: { control: "text" },
    text: { control: "text" },
  },
} as Meta

// Template for stories
const Template: Story<InfoCardsProps> = (args) => <InfoCards {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {
  sectionIdx: 0,
  count: 2,
  cards: [
    {
      imageUrl: "https://picsum.photos/200/300",
      title: "Default Title",
      text: "Default text here.",
    },
    {
      imageUrl: "https://picsum.photos/200/300",
      title: "Default Title",
      text: "Default text here.",
    },
  ],
}

// Custom scenario
export const CustomCard = Template.bind({})
CustomCard.args = {
  sectionIdx: 1,
  count: 1,
  cards: [
    {
      imageUrl: "https://picsum.photos/200/300",
      title: "Custom Title",
      text: "Custom text here.",
    },
  ],
}
