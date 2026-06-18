import type { HomePageSchemaType } from "@opengovsg/isomer-components"

import { makeSite } from "./site"

export const homeData: HomePageSchemaType = {
  layout: "homepage",
  site: makeSite({
    siteName: "Ministry of Trade and Industry",
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
          title: "About us",
          permalink: "/about",
          layout: "content",
          summary: "",
          lastModified: "",
          children: [],
        },
        {
          id: "3",
          title: "News",
          permalink: "/news",
          layout: "collection",
          summary: "",
          lastModified: "",
          children: [],
        },
      ],
    },
    navbar: {
      items: [
        {
          name: "About us",
          url: "/about",
          items: [
            { name: "Our mission", url: "/about/mission" },
            { name: "Leadership", url: "/about/leadership" },
          ],
        },
        { name: "Industries", url: "/industries" },
        { name: "Media", url: "/media" },
        { name: "Careers", url: "/careers" },
        { name: "Contact us", url: "/contact" },
      ],
    },
  }),
  meta: { description: "Ministry of Trade and Industry Singapore" },
  page: {
    permalink: "/",
    lastModified: "2024-05-02T14:12:57.160Z",
    title: "Home",
  },
  content: [
    {
      type: "hero",
      variant: "gradient",
      backgroundUrl:
        "https://images.unsplash.com/photo-1565967511849-76a60a516170?q=80&w=2071&auto=format&fit=crop",
      title: "Ministry of Trade and Industry",
      subtitle:
        "A leading global city of enterprise and talent, a vibrant nation of innovation and opportunity",
      buttonLabel: "Explore services",
      buttonUrl: "/",
      secondaryButtonLabel: "Learn more",
      secondaryButtonUrl: "/about",
    },
    {
      type: "infobar",
      variant: "light",
      title: "Supporting Singapore's economic growth",
      description:
        "We work with industry partners to create jobs, attract investments, and develop a vibrant economy for all Singaporeans.",
      buttonLabel: "Our work",
      buttonUrl: "/",
      secondaryButtonLabel: "Latest news",
      secondaryButtonUrl: "/news",
    },
    {
      type: "infopic",
      title: "Growing our industries together",
      description:
        "We champion enterprise development, promote international trade, and partner businesses to innovate and grow — creating good jobs for Singaporeans.",
      imageAlt: "Singapore skyline",
      imageSrc:
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=2052&auto=format&fit=crop",
      buttonLabel: "Learn more",
      buttonUrl: "/",
    },
    {
      type: "infocards",
      variant: "cardsWithImages",
      maxColumns: "3",
      title: "Key initiatives",
      subtitle:
        "Explore our programmes and schemes that support businesses and workers across all sectors.",
      label: "View all initiatives",
      url: "/",
      cards: [
        {
          title: "Enterprise Development Grant",
          url: "/",
          description:
            "Co-fund projects that help companies upgrade capabilities, innovate, and venture overseas.",
          imageUrl: "https://placehold.co/400x300/e6ecef/00405f?text=EDG",
          imageAlt: "Enterprise Development Grant",
        },
        {
          title: "Global Innovation Alliance",
          url: "/",
          description:
            "Connecting Singapore's innovation ecosystem with key global cities and tech hubs.",
          imageUrl: "https://placehold.co/400x300/e6ecef/00405f?text=GIA",
          imageAlt: "Global Innovation Alliance",
        },
        {
          title: "SkillsFuture for Enterprise",
          url: "/",
          description:
            "Support enterprises in building a culture of lifelong learning and workforce transformation.",
          imageUrl: "https://placehold.co/400x300/e6ecef/00405f?text=SFE",
          imageAlt: "SkillsFuture for Enterprise",
        },
      ],
    },
    {
      type: "keystatistics",
      title: "Key economic indicators",
      statistics: [
        { label: "GDP Growth, Q1 2025 (YoY)", value: "+3.8%" },
        { label: "Total Merchandise Trade, Mar 2025 (YoY)", value: "+5.2%" },
        { label: "Manufacturing Output, Mar 2025 (YoY)", value: "+1.4%" },
      ],
    },
    {
      type: "infopic",
      variant: "full",
      title: "Singapore ranked world's most competitive economy",
      description:
        "For the fourth consecutive year, Singapore has topped the IMD World Competitiveness Rankings, reflecting our strong fundamentals and business-friendly environment.",
      imageAlt: "Award ceremony",
      imageSrc:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop",
      buttonLabel: "Read more",
      buttonUrl: "/",
    },
  ],
}
