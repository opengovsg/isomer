import type { Meta, StoryObj } from "@storybook/react-vite"
import type { FooterProps } from "~/interfaces"
import { generateSiteConfig } from "~/stories/helpers"

import { Footer } from "./Footer"

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
    site: generateSiteConfig(),
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
      {
        type: "flickr",
        url: "https://www.facebook.com",
      },
      {
        type: "threads",
        url: "https://www.facebook.com",
      },
    ],
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
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
  },
}

export const WithSubscriptionCta: Story = {
  args: {
    siteName: "Enterprise Singapore",
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
    ],
    customNavItems: [
      {
        title: "Careers",
        url: "/",
      },
      {
        title: "Events calendar",
        url: "/",
      },
    ],
    socialMediaLinks: [
      {
        type: "facebook",
        url: "https://www.facebook.com",
      },
      {
        type: "instagram",
        url: "https://www.instagram.com",
      },
      {
        type: "linkedin",
        url: "https://www.linkedin.com",
      },
    ],
    contactUsLink: "/",
    feedbackFormLink: "https://www.google.com",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    subscriptionCta: {
      title: "Subscribe to our mailing list",
      description: "Get the latest updates on grants, programmes, and events.",
      buttonLabel: "Subscribe",
      buttonUrl: "https://form.gov.sg/example",
    },
  },
}

export const WithSubscriptionCtaNoDescription: Story = {
  args: {
    siteName: "Ministry of Health",
    isGovernment: true,
    lastUpdated: "11 Mar 2024",
    siteNavItems: [
      {
        title: "About us",
        url: "/",
      },
      {
        title: "Services",
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
        url: "https://www.twitter.com",
      },
    ],
    contactUsLink: "/",
    privacyStatementLink: "/",
    termsOfUseLink: "/",
    subscriptionCta: {
      title: "Stay informed with health updates",
      buttonLabel: "Sign up",
      buttonUrl: "https://form.gov.sg/health-updates",
    },
  },
}
