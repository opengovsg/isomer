import type { Meta, StoryFn } from "@storybook/react"
import Homepage from "./Homepage"
import { IsomerPageSchema } from "~/engine"

export default {
  title: "Next/Layouts/Homepage",
  component: Homepage,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<IsomerPageSchema> = (args) => <Homepage {...args} />

export const Default = Template.bind({})
Default.args = {
  site: {
    siteName: "Isomer Next",
    siteMap: [],
    theme: "next",
    language: "en",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.png",
  },
  page: {
    layout: "homepage",
    description: "A Next.js starter for Isomer",
  },
  content: [
    // {
    //   type: "Hero",
    //   variant: "gradient",
    //   alignment: "left",
    //   backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    //   title: "Ministry of Trade and Industry",
    //   subtitle:
    //     "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
    //   buttonLabel: "Main CTA",
    //   buttonUrl: "/",
    //   secondaryButtonLabel: "Sub CTA",
    //   secondaryButtonUrl: "/",
    // },
    {
      type: "infopic",
      title: "Infopic",
      imageSrc: "https://ohno.isomer.gov.sg/images/hero-banner.png",
      imageAlt: "Infopic",
      description: "This is an infopic component",
    },
    {
      type: "paragraph",
      content: "This is another text component",
    },
    {
      type: "paragraph",
      content: "This is yet another text component",
    },
  ],
}
