import type { Meta, StoryFn } from "@storybook/react"
import Hero, { type HeroProps } from "./Hero"

export default {
  title: "Next/Components/Hero",
  component: Hero,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<HeroProps> = (args) => <Hero {...args} />

export const Gradient = Template.bind({})
Gradient.args = {
  variant: "gradient",
  alignment: "left",
  backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  title: "Ministry of Trade and Industry",
  subtitle:
    "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
  buttonLabel: "Main CTA",
  buttonUrl: "/",
  secondaryButtonLabel: "Sub CTA",
  secondaryButtonUrl: "/",
}

export const Split = Template.bind({})
Split.args = {
  variant: "split",
  backgroundColor: "black",
  alignment: "left",
  backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  title: "Ministry of Trade and Industry",
  subtitle:
    "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
  buttonLabel: "Main CTA",
  buttonUrl: "/",
  secondaryButtonLabel: "Sub CTA",
  secondaryButtonUrl: "/",
}

export const Floating = Template.bind({})
Floating.args = {
  variant: "floating",
  backgroundColor: "black",
  alignment: "right",
  backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  title: "Ministry of Trade and Industry",
  subtitle:
    "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
  buttonLabel: "Main CTA",
  buttonUrl: "/",
  secondaryButtonLabel: "Sub CTA",
  secondaryButtonUrl: "/",
}

export const CopyLed = Template.bind({})
CopyLed.args = {
  variant: "copyled",
  backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
  title: "Ministry of Trade and Industry",
  subtitle:
    "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
  buttonLabel: "Main CTA",
  buttonUrl: "/",
  secondaryButtonLabel: "Sub CTA",
  secondaryButtonUrl: "/",
}

export const FloatingImage = Template.bind({})
FloatingImage.args = {
  variant: "floatingimage",
  backgroundUrl: "https://placehold.co/600x400",
  title: "Ministry of Trade and Industry",
  subtitle:
    "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
  buttonLabel: "Main CTA",
  buttonUrl: "/",
  secondaryButtonLabel: "Sub CTA",
  secondaryButtonUrl: "/",
}
