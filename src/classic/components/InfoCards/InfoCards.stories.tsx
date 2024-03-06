import { Meta, StoryFn } from "@storybook/react"
import InfoCards from "./InfoCards"
import { InfoCardsProps } from "~/common"

export default {
  title: "Classic/Components/InfoCards",
  component: InfoCards,
  argTypes: {
    // Define the prop types and control options here
    imageUrl: { control: "text" },
    title: { control: "text" },
    text: { control: "text" },
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
      title: "Default Title",
      text: "Default text here.",
    },
    {
      imageUrl: "https://placehold.co/200x300",
      title: "Default Title",
      text: "Default text here.",
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
      title: "Custom Title",
      text: "Custom text here.",
    },
  ],
}
