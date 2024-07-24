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
