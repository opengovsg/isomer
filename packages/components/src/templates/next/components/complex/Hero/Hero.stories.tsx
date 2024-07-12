import type { Meta, StoryObj } from "@storybook/react"

import Hero from "./Hero"

const meta: Meta<typeof Hero> = {
  title: "Next/Components/Hero",
  component: Hero,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}

export default meta
type Story = StoryObj<typeof Hero>

export const Gradient: Story = {
  args: {
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
  },
}

export const Split: Story = {
  args: {
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
  },
}

export const Floating: Story = {
  args: {
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
  },
}

export const CopyLed: Story = {
  args: {
    variant: "copyled",
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    title: "Ministry of Trade and Industry",
    subtitle:
      "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
  },
}

export const FloatingImage: Story = {
  args: {
    variant: "floatingimage",
    backgroundUrl: "https://placehold.co/600x400",
    title: "Ministry of Trade and Industry",
    subtitle:
      "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
  },
}
