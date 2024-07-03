import type { Meta, StoryFn } from "@storybook/react";

import type { CollectionPageSchema } from "~/engine";
import CollectionLayout from "./Collection";

export default {
  title: "Next/Layouts/Collection",
  component: CollectionLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<CollectionPageSchema> = (args) => (
  <CollectionLayout {...args} />
);

export const Default = Template.bind({});
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
      children: [
        {
          title: "Publications and other press releases",
          permalink: "/publications",
          lastModified: "",
          layout: "collection",
          summary: "",
          children: [
            {
              title: "This is a publication title that is really long because",
              permalink: "/publications/item-one",
              lastModified: "",
              layout: "article",
              summary:
                "We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year. We’ve looked at how people’s spending correlates with how much microscopic plastic they consumed over the year.",
              date: "2024-05-07",
              category: "Category Name",
            },
            {
              title: "Isomer hero banner",
              permalink: "/publications/item-two",
              lastModified: "",
              layout: "file",
              summary:
                "This is supposed to be a description of the hero banner that Isomer uses on their official website.",
              date: "2024-05-07",
              category: "Category Name",
              ref: "https://www.isomer.gov.sg/images/Homepage/hero%20banner_10.png",
              fileDetails: {
                type: "png",
                size: "1.2MB",
              },
            },
            {
              title: "Isomer guide",
              permalink: "/publications/item-three",
              lastModified: "",
              layout: "link",
              summary:
                "Have a look at the Isomer guide to understand how to use the Isomer CMS.",
              date: "2023-08-12",
              category: "Category Name",
              ref: "https://guide.isomer.gov.sg",
            },
          ],
        },
      ],
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
    lastModified: "2024-05-02T14:12:57.160Z",
    subtitle:
      "Since this page type supports text-heavy articles that are primarily for reading and absorbing information, the max content width on desktop is kept even smaller than its General Content Page counterpart.",
    defaultSortBy: "date",
    defaultSortDirection: "desc",
  },
};
