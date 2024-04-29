import type { Meta, StoryFn } from "@storybook/react"
import type { ArticlePageSchema } from "~/engine"
import ArticleLayout from "./Article"

export default {
  title: "Next/Layouts/Article",
  component: ArticleLayout,
  argTypes: {},
  parameters: {
    themes: {
      themeOverride: "Isomer Next",
    },
  },
} as Meta

// Template for stories
const Template: StoryFn<ArticlePageSchema> = (args) => (
  <ArticleLayout {...args} />
)

export const Default = Template.bind({})
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
      "Man sentenced to 24 months' imprisonment for smuggling 34.7 kg of rhinoceros horns",
    permalink:
      "/newsroom/news/man-sentenced-to-24-months-imprisonment-for-smuggling-34-7-kg-of-rhinoceros-horns",
    category: "NParks Happenings",
    date: "1 May 2024",
    articlePageHeader: {
      summary: [
        "20 pieces of rhinoceros horns were found in two pieces of transit baggage bound for Laos.",
        "The 34.7 kg seizure is the largest seizure of rhinoceros horns in Singapore to date.",
      ],
    },
  },
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "South African Gumede Sthembiso Joel, 33, was sentenced to 24 months’ imprisonment today after pleading guilty to two charges under the Endangered Species (Import and Export) Act [1] (“ESA”) for transiting in Singapore with rhinoceros horns without a valid permit. This is the heaviest sentence meted out in Singapore to date for a case involving the smuggling of wildlife parts.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "On 4 October 2022, the National Parks Board (NParks) seized 20 pieces of rhinoceros horns that were being smuggled through Singapore Changi Airport. Airport security and NParks’ K9 Unit detected and inspected two pieces of baggage (“Boxes”) and found 34.7 kg of rhinoceros horns, which would have an estimated wholesale value of approximately S$1,200,140.79 (US$843,210) as of 4 October 2022. The accused, who was travelling from South Africa to the Lao People’s Democratic Republic through Singapore, was immediately arrested and the rhinoceros horns were seized by NParks.",
        },
      ],
    },
  ],
}
