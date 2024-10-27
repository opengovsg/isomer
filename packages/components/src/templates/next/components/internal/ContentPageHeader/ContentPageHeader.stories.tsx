import type { Meta, StoryObj } from "@storybook/react"

import type { ContentPageHeaderProps } from "~/interfaces"
import { ISOMER_PAGE_LAYOUTS } from "~/types"
import ContentPageHeader from "./ContentPageHeader"

const meta: Meta<ContentPageHeaderProps> = {
  title: "Next/Internal Components/ContentPageHeader",
  component: ContentPageHeader,
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
        layout: ISOMER_PAGE_LAYOUTS.Homepage,
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
type Story = StoryObj<typeof ContentPageHeader>

export const Default: Story = {
  args: {
    title: "Steven Pinker’s Steven Pinker’s Rationality",
    summary:
      "Steven Pinker's exploration of rationality delves into the intricacies of human cognition, shedding light on the mechanisms behind our decision-making processes. Through empirical research and insightful analysis, Pinker illuminates the rationality that underpins human behavior, challenging conventional wisdom and offering new perspectives on the rational mind.",
    breadcrumb: {
      links: [
        {
          title: "Irrationality",
          url: "/irrationality",
        },
        {
          title: "For Individuals",
          url: "/irrationality/individuals",
        },
        {
          title: "Steven Pinker's Rationality",
          url: "/irrationality/individuals/pinker-rationality",
        },
      ],
    },
    buttonLabel: "Submit a proposal",
    buttonUrl: "https://www.google.com",
  },
}
