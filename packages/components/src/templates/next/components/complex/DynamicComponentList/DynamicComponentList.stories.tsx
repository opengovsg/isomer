import type { Meta, StoryObj } from "@storybook/react"

import type { DynamicComponentListProps } from "~/interfaces"
import { DynamicComponentList } from "./DynamicComponentList"

const meta: Meta<DynamicComponentListProps> = {
  title: "Next/Components/DynamicComponentList",
  component: DynamicComponentList,
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
  },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  args: {
    dataSource: {
      resourceId: "d_3a16f056620fa4a63a31fc70df756eea",
    },
    component: {
      type: "keystatistics",
      title: "his_email",
      statistics: "hello_statistics",
    },
  },
}
