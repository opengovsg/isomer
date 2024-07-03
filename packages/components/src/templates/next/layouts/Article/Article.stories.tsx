import type { Meta, StoryFn } from "@storybook/react";

import type { ArticlePageSchema } from "~/engine";
import ArticleLayout from "./Article";

export default {
  title: "Next/Layouts/Article",
  component: ArticleLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta;

// Template for stories
const Template: StoryFn<ArticlePageSchema> = (args) => (
  <ArticleLayout {...args} />
);

export const Default = Template.bind({});
Default.args = {
  layout: "article",
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
          title: "Newsroom",
          permalink: "/newsroom",
          lastModified: "",
          layout: "content",
          summary: "",
          children: [
            {
              title: "News",
              permalink: "/newsroom/news",
              lastModified: "",
              layout: "content",
              summary: "",
              children: [
                {
                  title:
                    "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
                  permalink:
                    "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
                  lastModified: "",
                  layout: "content",
                  summary: "",
                },
              ],
            },
          ],
        },
      ],
    },
    theme: "isomer-next",
    isGovernment: true,
    logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
    navBarItems: [
      {
        name: "Home",
        url: "/",
      },
      {
        name: "Newsroom",
        url: "/newsroom",
        items: [
          {
            name: "News",
            url: "/newsroom/news",
          },
        ],
      },
    ],
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
    title:
      "Singapore's Spectacular Citizens' Festival: a Celebration of Unity and Diversity",
    permalink:
      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
    lastModified: "2024-05-02T14:12:57.160Z",
    category: "Citizen Engagement",
    date: "1 May 2024",
    articlePageHeader: {
      summary: [
        "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard.",
        "The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      ],
    },
  },
  content: [
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "A man is serving food out of a blue food",
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Singapore - In a bid to foster community spirit and celebrate the rich tapestry of its diverse population, Singapore is gearing up to host its first-ever Citizens' Festival. This unprecedented event promises to be a dazzling extravaganza filled with entertainment, cultural showcases, and gastronomic delights.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "One of the highlights of the festival is the Cultural Village, where visitors can immerse themselves in the sights, sounds, and flavors of Singapore's various ethnic communities. From traditional Malay dance performances to Chinese calligraphy demonstrations and Indian culinary workshops, attendees will have the opportunity to gain a deeper appreciation for the country's multicultural heritage.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a Chat-GPT4 generated article for visual testing purposes.",
        },
      ],
    },
  ],
};
