import type { Meta, StoryObj } from "@storybook/react"

import { type ArticlePageSchemaType } from "~/types"
import ArticleLayout from "./Article"

const meta: Meta<ArticlePageSchemaType> = {
  title: "Next/Layouts/Article",
  component: ArticleLayout,
  argTypes: {},
  tags: ["!autodocs"],
  parameters: {
    layout: "fullscreen",
    themes: {
      themeOverride: "Isomer Next",
    },
  },
}
export default meta
type Story = StoryObj<typeof ArticleLayout>

const generateArgs = ({
  summary,
}: {
  summary: string
}): ArticlePageSchemaType => {
  return {
    layout: "article",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Newsroom",
            permalink: "/newsroom",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "News",
                permalink: "/newsroom/news",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
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
      logoUrl: "/isomer-logo.svg",
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
        summary,
      },
    },
    content: [
      {
        type: "prose",
        content: [
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
            type: "heading",
            attrs: {
              id: "section2",
              level: 2,
            },
            content: [
              {
                type: "text",
                text: "It does look a bit odd but we can't fix until the typography scale is rejigged",
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
      },
    ],
  }
}

export const Default: Story = {
  name: "Article",
  args: {
    layout: "article",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Newsroom",
            permalink: "/newsroom",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "News",
                permalink: "/newsroom/news",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
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
      logoUrl: "/isomer-logo.svg",
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
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
    },
    content: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        alt: "A man is serving food out of a blue food",
      },
      {
        type: "prose",
        content: [
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
      },
    ],
  },
}

export const NoImage: Story = {
  name: "NoImage",
  args: {
    layout: "article",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Newsroom",
            permalink: "/newsroom",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "News",
                permalink: "/newsroom/news",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
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
      logoUrl: "/isomer-logo.svg",
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
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
    },
    content: [
      {
        type: "image",
        src: "",
        alt: "",
      },
      {
        type: "prose",
        content: [
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
      },
    ],
  },
}

export const NoSummary: Story = {
  name: "NoSummary",
  args: generateArgs({ summary: "" }),
}

export const EmptySummary: Story = {
  name: "EmptySummary",
  args: generateArgs({ summary: "   " }),
}

export const TaggedArticle: Story = {
  name: "TaggedArticle",
  args: {
    layout: "article",
    site: {
      siteName: "Isomer Next",
      siteMap: {
        id: "1",
        title: "Home",
        permalink: "/",
        lastModified: "",
        layout: "homepage",
        summary: "",
        children: [
          {
            id: "2",
            title: "Newsroom",
            permalink: "/newsroom",
            lastModified: "",
            layout: "content",
            summary: "",
            children: [
              {
                id: "3",
                title: "News",
                permalink: "/newsroom/news",
                lastModified: "",
                layout: "content",
                summary: "",
                children: [
                  {
                    id: "4",
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
      logoUrl: "/isomer-logo.svg",
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
        summary:
          "Singapore is preparing to host its inaugural Citizens' Festival in Marina Boulevard. The festival aims to unite Singaporeans of all backgrounds through cultural showcases, food markets, live music, and wellness activities.",
      },
      tags: [
        {
          category: "Tags",
          selected: ["NParks Happenings", "Wild dinosaur"],
        },
        {
          category: "Brand",
          selected: ["Daikin", "TP Link", "Asus"],
        },
      ],
    },
    content: [
      {
        type: "image",
        src: "https://images.unsplash.com/photo-1570441262582-a2d4b9a916a5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        alt: "A man is serving food out of a blue food",
      },
      {
        type: "prose",
        content: [
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
      },
    ],
  },
}

// Placing this story here as it's due to the overflow-x-auto class on the parent div
export const OrderedList100Items: Story = {
  name: "100th Ordered Marker Not Truncated",
  args: {
    ...generateArgs({ summary: "" }),
    content: [
      {
        type: "prose",
        content: [
          {
            type: "orderedList",
            content: Array.from({ length: 100 }, (_, i) => ({
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: `Item ${i + 1}` }],
                },
              ],
            })),
          },
        ],
      },
    ],
  },
}
