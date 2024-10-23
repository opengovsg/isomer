import type { Meta, StoryObj } from "@storybook/react"

import type { FooterProps } from "~/interfaces"
import Footer from "./Footer"

const meta: Meta<FooterProps> = {
  title: "Next/Internal Components/Footer",
  component: Footer,
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
      logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
      lastUpdated: "2021-10-01",
      assetsBaseUrl: "https://cms.isomer.gov.sg",
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
type Story = StoryObj<typeof Footer>

// Default scenario
export const Default: Story = {
  args: {
    siteName: "Ministry of Trade and Industry",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    siteNavItems: [
      {
        title: "About us",
        url: "/",
      },
      {
        title: "Our partners",
        url: "/",
      },
      {
        title: "Grants and programmes",
        url: "/",
      },
      {
        title: "Contact us",
        url: "/",
      },
      {
        title: "Something else",
        url: "/",
      },
      {
        title: "Resources",
        url: "/",
      },
    ],
    customNavItems: [
      {
        title: "Careers",
        url: "/",
      },
      {
        title: "2024 budget increase",
        url: "/",
      },
      {
        title: "Events calendar",
        url: "/",
      },
      {
        title: "Our Corp Site",
        url: "https://www.google.com",
      },
    ],
    socialMediaLinks: [
      {
        type: "facebook",
        url: "https://www.facebook.com",
      },
      {
        type: "twitter",
        url: "https://www.facebook.com",
      },
      {
        type: "instagram",
        url: "https://www.facebook.com",
      },
      {
        type: "linkedin",
        url: "https://www.facebook.com",
      },
      {
        type: "telegram",
        url: "https://www.facebook.com",
      },
      {
        type: "youtube",
        url: "https://www.facebook.com",
      },
      {
        type: "github",
        url: "https://www.facebook.com",
      },
      {
        type: "tiktok",
        url: "https://www.facebook.com",
      },
      {
        type: "whatsapp",
        url: "https://www.facebook.com",
      },
    ],
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    siteMapLink: "/",
  },
}

export const NonGovernment: Story = {
  args: {
    siteName: "IsoCon 2024",
    agencyName: "IsoCorp",
    isGovernment: false,
    lastUpdated: "11 Mar 2024",
    siteNavItems: [
      {
        title: "About us",
        url: "/",
      },
      {
        title: "Our partners",
        url: "/",
      },
      {
        title: "Grants and programmes",
        url: "/",
      },
      {
        title: "Contact us",
        url: "/",
      },
      {
        title: "Something else",
        url: "/",
      },
      {
        title: "Resources",
        url: "/",
      },
    ],
    customNavItems: [
      {
        title: "Careers",
        url: "/",
      },
      {
        title: "2024 budget increase",
        url: "/",
      },
      {
        title: "Events calendar",
        url: "/",
      },
      {
        title: "Our Corp Site",
        url: "https://www.google.com",
      },
    ],
    socialMediaLinks: [
      {
        type: "facebook",
        url: "https://www.facebook.com",
      },
      {
        type: "twitter",
        url: "https://www.facebook.com",
      },
      {
        type: "instagram",
        url: "https://www.facebook.com",
      },
      {
        type: "linkedin",
        url: "https://www.facebook.com",
      },
      {
        type: "telegram",
        url: "https://www.facebook.com",
      },
      {
        type: "youtube",
        url: "https://www.facebook.com",
      },
      {
        type: "github",
        url: "https://www.facebook.com",
      },
      {
        type: "tiktok",
        url: "https://www.facebook.com",
      },
      {
        type: "whatsapp",
        url: "https://www.facebook.com",
      },
    ],
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    siteMapLink: "/",
  },
}

export const NoSocmed: Story = {
  args: {
    siteName: "Ministry of Trade and Industry",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    siteNavItems: [
      {
        title: "About us",
        url: "/",
      },
      {
        title: "Our partners",
        url: "/",
      },
      {
        title: "Grants and programmes",
        url: "/",
      },
      {
        title: "Contact us",
        url: "/",
      },
      {
        title: "Something else",
        url: "/",
      },
      {
        title: "Resources",
        url: "/",
      },
    ],
    customNavItems: [
      {
        title: "Careers",
        url: "/",
      },
      {
        title: "2024 budget increase",
        url: "/",
      },
      {
        title: "Events calendar",
        url: "/",
      },
      {
        title: "Our Corp Site",
        url: "https://www.google.com",
      },
    ],
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    siteMapLink: "/",
  },
}

export const NoCustomItems: Story = {
  args: {
    siteName: "Ministry of Trade and Industry",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    siteNavItems: [
      {
        title: "About us",
        url: "/",
      },
      {
        title: "Our partners",
        url: "/",
      },
      {
        title: "Grants and programmes",
        url: "/",
      },
      {
        title: "Contact us",
        url: "/",
      },
      {
        title: "Something else",
        url: "/",
      },
      {
        title: "Resources",
        url: "/",
      },
    ],
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    siteMapLink: "/",
  },
}
