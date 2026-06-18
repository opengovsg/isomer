import type { ArticlePageSchemaType } from "@opengovsg/isomer-components"

import { makeSite } from "./site"

export const articleData: ArticlePageSchemaType = {
  layout: "article",
  site: makeSite({
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
          layout: "collection",
          summary: "",
          children: [
            {
              id: "3",
              title: "Singapore ranks first in global competitiveness index",
              permalink: "/newsroom/singapore-ranks-first",
              lastModified: "",
              layout: "article",
              summary: "",
              children: [],
            },
          ],
        },
      ],
    },
    navbar: {
      items: [
        { name: "Home", url: "/" },
        {
          name: "Newsroom",
          url: "/newsroom",
          items: [
            { name: "Press releases", url: "/newsroom/press-releases" },
            { name: "Speeches", url: "/newsroom/speeches" },
          ],
        },
        { name: "About us", url: "/about" },
        { name: "Contact", url: "/contact" },
      ],
    },
  }),
  page: {
    title: "Singapore ranks first in IMD World Competitiveness Ranking 2025",
    permalink: "/newsroom/singapore-ranks-first",
    lastModified: "2024-05-02T14:12:57.160Z",
    category: "Press Release",
    date: "15 May 2025",
    articlePageHeader: {
      summary:
        "Singapore has topped the IMD World Competitiveness Rankings for the fourth year running, underscoring the country's strong economic fundamentals, world-class infrastructure, and pro-business environment.",
    },
  },
  content: [
    {
      type: "image",
      src: "https://images.unsplash.com/photo-1565967511849-76a60a516170?q=80&w=2071&auto=format&fit=crop",
      alt: "Singapore skyline at dusk",
    },
    {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "SINGAPORE – Singapore has retained its position as the world's most competitive economy in the 2025 IMD World Competitiveness Ranking, marking the fourth consecutive year the city-state has claimed the top spot. The ranking, published by the International Institute for Management Development, evaluates 67 economies across more than 330 criteria.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "The results reflect Singapore's consistently strong performance in economic performance, government efficiency, business efficiency, and infrastructure — the four key pillars assessed by the IMD.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { id: "factors", level: 2 },
          content: [{ type: "text", text: "Key factors driving Singapore's ranking" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Singapore scored particularly highly in areas including international trade and investment openness, the quality of business legislation, and the availability of skilled labour. The country's digital infrastructure and e-government services were also highlighted as major strengths.",
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Top-ranked for business efficiency and labour market flexibility" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Highest scores for economic openness and international investment flows" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Strong performance in digital and physical infrastructure" }],
                },
              ],
            },
          ],
        },
        {
          type: "heading",
          attrs: { id: "reaction", level: 2 },
          content: [{ type: "text", text: "Government response" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: 'The Minister for Trade and Industry said: "This ranking reflects the collective efforts of our businesses, workers, and government agencies. We remain committed to building a dynamic and inclusive economy where enterprises can grow and Singaporeans can thrive."',
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "MTI will continue to work closely with industry partners to enhance Singapore's attractiveness as a global business hub, while supporting local enterprises in their internationalisation journeys and capability development.",
            },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      quote:
        "Singapore's continued excellence in the global competitiveness rankings reflects decades of thoughtful policymaking, investment in human capital, and an unwavering commitment to openness.",
      source: "IMD World Competitiveness Centre Director",
    },
  ],
}
