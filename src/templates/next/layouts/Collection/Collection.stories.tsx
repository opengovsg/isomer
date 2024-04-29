import type { Meta, StoryFn } from "@storybook/react"
import type { CollectionPageSchema } from "~/engine"
import CollectionLayout from "./Collection"

export default {
  title: "Next/Layouts/Collection",
  component: CollectionLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<CollectionPageSchema> = (args) => (
  <CollectionLayout {...args} />
)

export const Default = Template.bind({})
Default.args = {
  layout: "collection",
  site: {
    siteName: "Isomer Next",
    siteMap: {
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
    navBarItems: [],
    footerItems: {
      privacyStatementLink: "https://www.isomer.gov.sg/privacy",
      termsOfUseLink: "https://www.isomer.gov.sg/terms",
      siteNavItems: [],
    },
    lastUpdated: "1 Jan 2021",
    search: {
      type: "localSearch",
      searchUrl: "/search",
    },
    notification: "This is a notification",
  },
  page: {
    title: "Publications and other press releases",
    description: "A Next.js starter for Isomer",
    permalink: "/publications",
    subtitle:
      "Since this page type supports text-heavy articles that are primarily for reading and absorbing information, the max content width on desktop is kept even smaller than its General Content Page counterpart.",
    defaultSortBy: "date",
    defaultSortDirection: "desc",
  },
}
