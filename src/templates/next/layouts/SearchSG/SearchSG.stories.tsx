import type { Meta, StoryFn } from "@storybook/react"
import type { SearchSGPageSchema } from "~/engine"
import SearchSGLayout from "./SearchSG"
import { useEffect } from "react"

export default {
  title: "Next/Layouts/SearchSG",
  component: SearchSGLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta
const TEST_CLIENT_ID = "7946e346-993e-41c7-bd81-26a3999dc3f4"

// Template for stories
const Template: StoryFn<SearchSGPageSchema> = (args) => {
  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}&page=result`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [])

  return <SearchSGLayout {...args} />
}

export const Default = Template.bind({})
Default.args = {
  layout: "searchsg",
  site: {
    siteName: "Isomer Next",
    siteMap: { title: "Home", permalink: "/", children: [] },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "searchSG",
      clientId: TEST_CLIENT_ID,
    },
  },
  page: {
    title: "Search",
    description: "Search results",
    permalink: "/search",
  },
}
