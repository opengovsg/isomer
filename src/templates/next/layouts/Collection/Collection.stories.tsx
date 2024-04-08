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
      type: "localSearch",
      searchUrl: "/search",
    },
  },
  page: {
    title: "Publications and other press releases",
    description: "A Next.js starter for Isomer",
    permalink: "/publications",
    subtitle:
      "Since this page type supports text-heavy articles that are primarily for reading and absorbing information, the max content width on desktop is kept even smaller than its General Content Page counterpart.",
    defaultSortBy: "date",
    defaultSortDirection: "desc",
    items: [
      {
        type: "collectionCard",
        lastUpdated: "December 1, 2023",
        category: "Research",
        title:
          "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
        url: "/",
        description:
          "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
        image: {
          src: "https://placehold.co/500x500",
          alt: "placeholder",
        },
        variant: "article",
      },
      {
        type: "collectionCard",
        lastUpdated: "December 2, 2023",
        category: "Research",
        title:
          "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
        url: "/",
        description:
          "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
        image: {
          src: "https://placehold.co/500x500",
          alt: "placeholder",
        },
        variant: "file",
        fileDetails: {
          type: "pdf",
          size: "2.3 MB",
        },
      },
      {
        type: "collectionCard",
        lastUpdated: "January 3, 2024",
        category: "Research",
        title:
          "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
        url: "/",
        description:
          "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
        image: {
          src: "https://placehold.co/500x500",
          alt: "placeholder",
        },
        variant: "article",
      },
      {
        type: "collectionCard",
        lastUpdated: "December 3, 2023",
        category: "Opinion",
        title:
          "A journal on microscopic plastic and their correlation to the number of staycations enjoyed per millennials between the ages of 30-42, substantiated by research from IDK university",
        url: "/",
        description:
          "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
        image: {
          src: "https://placehold.co/500x500",
          alt: "placeholder",
        },
        variant: "article",
      },
    ],
  },
}
