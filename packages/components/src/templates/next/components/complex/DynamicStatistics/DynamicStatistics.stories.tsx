import type { Meta, StoryObj } from "@storybook/react"

import { DynamicStatisticsUI } from "./DynamicStatistics"

const meta: Meta<typeof DynamicStatisticsUI> = {
  title: "Next/Components/DynamicStatistics",
  component: DynamicStatisticsUI,
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
type Story = StoryObj<typeof DynamicStatisticsUI>

export const Default: Story = {
  args: {
    title: "1 January 2025 | 1 Rejab 1446H",
    statistics: [
      { label: "Subuh", value: "5:43am" },
      { label: "Syuruk", value: "7:07am" },
      { label: "Zohor", value: "1:09pm" },
      { label: "Asar", value: "4.33pm" },
      { label: "Maghrib", value: "7.10pm" },
      { label: "Isyak", value: "8.25pm" },
    ],
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    label: "View all dates",
  },
}
