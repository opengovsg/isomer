import type { Meta, StoryObj } from "@storybook/react"

import { DynamicStatistics } from "./DynamicStatistics"

const meta: Meta<typeof DynamicStatistics> = {
  title: "Next/Components/DynamicStatistics",
  component: DynamicStatistics,
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
type Story = StoryObj<typeof DynamicStatistics>

export const Default: Story = {}
