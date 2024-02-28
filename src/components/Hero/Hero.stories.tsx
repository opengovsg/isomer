import { Story, Meta } from "@storybook/react"
import Hero, { HeroProps } from "./Hero"

export default {
  title: "Components/Hero",
  component: Hero,
  argTypes: {},
} as Meta

// Template for stories
const Template: Story<HeroProps> = (args) => <Hero {...args} />

// Default scenario
export const Default = Template.bind({})
Default.args = {}

// Custom scenario
export const CustomCard = Template.bind({})
CustomCard.args = {
  heroTitle: "Custom title",
  heroCaption: "Custom title with some text and other stuff",
  buttonLabel: "Custom button",
  buttonUrl: "https://google.com",
  logoUrl: "https://picsum.photos/200",
  bgUrl: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8",
}
