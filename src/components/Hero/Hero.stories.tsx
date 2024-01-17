// InfoCards.stories.tsx

import React from "react"
import { Story, Meta } from "@storybook/react"
import Hero from "./Hero"

export default {
  title: "Isomer/Hero",
  component: Hero,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<InfoCardsProps> = (args) => <Hero {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {}

// Custom scenario
export const CustomCard = Template.bind({})
CustomCard.args = {}
