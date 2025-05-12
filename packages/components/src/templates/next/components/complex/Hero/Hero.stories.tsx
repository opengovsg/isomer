import type { Meta, StoryObj } from "@storybook/react"

import type { HeroProps } from "~/interfaces/complex/Hero"
import Hero from "./Hero"

const SITE_ARGS: Partial<HeroProps> = {
  site: {
    siteName: "Isomer Next",
    siteMap: {
      id: "1",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [],
    },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "/isomer-logo.svg",
    lastUpdated: "2021-10-01",
    navbar: { items: [] },
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
  },
}

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
    ...SITE_ARGS,
    backgroundUrl: "https://ohno.isomer.gov.sg/images/hero-banner.png",
    title: "Ministry of Trade and Industry",
    subtitle:
      "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "gradient",
  },
}

export const ColourBlock: Story = {
  args: {
    ...SITE_ARGS,
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "block",
    theme: "default",
  },
}

export const ColourBlockInverse: Story = {
  args: {
    ...SITE_ARGS,
    backgroundUrl:
      "https://images.unsplash.com/photo-1725652264563-9f8eea4e2995?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "block",
    theme: "inverse",
  },
}

export const LargeImage: Story = {
  args: {
    ...SITE_ARGS,
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "largeImage",
  },
}

export const Floating: Story = {
  args: {
    ...SITE_ARGS,
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "floating",
  },
}

export const FloatingInverse: Story = {
  args: {
    ...SITE_ARGS,
    backgroundUrl:
      "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Your hero title goes here, please keep it short and sweet",
    subtitle:
      "A test for a long subtitle that will expand the hero banner. What will happen if the text is very very very long?",
    buttonLabel: "Main CTA",
    buttonUrl: "/",
    secondaryButtonLabel: "Sub CTA",
    secondaryButtonUrl: "/",
    variant: "floating",
    theme: "inverse",
  },
}
