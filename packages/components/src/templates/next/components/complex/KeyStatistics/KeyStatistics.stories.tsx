import type { Meta, StoryObj } from "@storybook/react"

import type { KeyStatisticsProps } from "~/interfaces"
import KeyStatistics from "./KeyStatistics"

const meta: Meta<KeyStatisticsProps> = {
  title: "Next/Components/KeyStatistics",
  component: KeyStatistics,
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
type Story = StoryObj<typeof KeyStatistics>

export const Top: Story = {
  args: {
    title: "Work life in numbers",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "3",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+12.2%" },
      { label: "Creative blocks met per single evening", value: "89" },
      { label: "Number of lies in this stat block", value: "4.0" },
    ],
  },
}

export const TopLong: Story = {
  args: {
    title: "Work life in numbers",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      { label: "Creative blocks met per single evening", value: "82329" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
  },
}

export const ThreeStats: Story = {
  args: {
    title:
      "A long title that should wrap properly, if the max width of the title is done well",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
  },
}

export const WithLink: Story = {
  args: {
    title: "Short title",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
    url: "https://www.google.com",
  },
}

export const WithLinkAndLongTitle: Story = {
  args: {
    title:
      "A long title that should wrap properly, if the max width of the title is done well",
    statistics: [
      {
        label: "Average all nighters pulled in a typical calendar month",
        value: "300,000",
      },
      { label: "Growth in tasks assigned Q4 2024 (YoY)", value: "+123.2%" },
      {
        label:
          "Number of lies in this stat block along with a lot of content and text that may not be read by users",
        value: "4.0",
      },
    ],
    url: "https://www.google.com",
  },
}
