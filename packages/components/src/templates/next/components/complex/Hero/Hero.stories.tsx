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
  args: {
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
      navBarItems: [],
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
    variant: "gradient",
  },
}

export const ColourBlock: Story = {
  args: {
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
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      navBarItems: [],
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
  },
}

export const ColourBlockInverse: Story = {
  args: {
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
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      navBarItems: [],

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
  },
}
