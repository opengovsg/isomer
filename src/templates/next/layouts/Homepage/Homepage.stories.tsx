import type { Meta, StoryFn } from "@storybook/react"
import Homepage from "./Homepage"
import { HomePageSchema } from "~/engine"

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
const Template: StoryFn<HomePageSchema> = (args) => <Homepage {...args} />

export const Default = Template.bind({})
Default.args = {
  layout: "homepage",
  site: {
    siteName: "Isomer Next",
    siteMap: [],
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
  },
  page: {
    title: "Home page",
    description: "A Next.js starter for Isomer",
  },
  content: [
    {
      type: "hero",
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
