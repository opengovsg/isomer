import type { Meta, StoryFn } from "@storybook/react"
import type { SearchPageSchema } from "~/engine"
import SearchLayout from "./Search"
import { useEffect } from "react"

export default {
  title: "Next/Layouts/Search",
  component: SearchLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

const TEST_CLIENT_ID = "5485bb61-2d5d-440a-bc37-91c48fc0c9d4"

// Template for stories
const Template: StoryFn<SearchPageSchema> = (args) => {
  // Note: This is needed because the script tag is not rendered in the storybook
  useEffect(() => {
    if (args.site.search && args.site.search.type !== "searchSG") return

    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${TEST_CLIENT_ID}&page=result`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)

    return () => {
      document.body.removeChild(scriptTag)
    }
  }, [])

  return <SearchLayout {...args} />
}

export const SearchSG = Template.bind({})
SearchSG.storyName = "SearchSG"
SearchSG.args = {
  layout: "search",
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
