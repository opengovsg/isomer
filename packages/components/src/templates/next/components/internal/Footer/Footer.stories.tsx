import type { Meta, StoryObj } from "@storybook/react-vite"
import type { FooterProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Footer } from "./Footer"

const meta: Meta<FooterProps> = {
  argTypes: {},
  args: {
    site: generateSiteConfig(),
  },
  component: Footer,
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
  title: "Next/Internal Components/Footer",
}
export default meta
type Story = StoryObj<typeof Footer>

// Default scenario
export const Default: Story = {
  args: {
    contactUsLink: "/",
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
    feedbackFormLink: "https://www.google.com",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    privacyStatementLink: "/",
    siteName: "Ministry of Trade and Industry",
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
      {
        type: "flickr",
        url: "https://www.facebook.com",
      },
      {
        type: "threads",
        url: "https://www.facebook.com",
      },
    ],
    termsOfUseLink: "/",
  },
}

export const NonGovernment: Story = {
  args: {
    agencyName: "IsoCorp",
    contactUsLink: "/",
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
    feedbackFormLink: "https://www.google.com",
    isGovernment: false,
    lastUpdated: "11 Mar 2024",
    privacyStatementLink: "/",
    siteName: "IsoCon 2024",
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
    termsOfUseLink: "/",
  },
}

export const NoSocmed: Story = {
  args: {
    contactUsLink: "/",
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
    feedbackFormLink: "https://www.google.com",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    privacyStatementLink: "/",
    siteName: "Ministry of Trade and Industry",
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
    termsOfUseLink: "/",
  },
}

export const NoCustomItems: Story = {
  args: {
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    privacyStatementLink: "/",
    siteName: "Ministry of Trade and Industry",
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
    termsOfUseLink: "/",
  },
}
