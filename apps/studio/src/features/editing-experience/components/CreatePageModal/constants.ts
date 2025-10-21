import type { NEW_PAGE_LAYOUT_VALUES } from "~/schemas/page"

export type Layout = (typeof NEW_PAGE_LAYOUT_VALUES)[number]

export const LAYOUT_RENDER_DATA: Record<
  Layout,
  {
    title: string
    description: string
    imageSrc: string
    altText: string
  }
> = {
  content: {
    title: "Default layout",
    description: "This is the most basic layout for your content.",
    imageSrc: "/assets/layout-card/default_layout_card.webp",
    altText: "Image preview of Default layout",
  },
  article: {
    title: "Article layout",
    description:
      "Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches.",
    imageSrc: "/assets/layout-card/article_layout_card.webp",
    altText: "Image preview of Article layout",
  },
  database: {
    title: "Database layout",
    description: "Link your dataset from Data.gov.sg.",
    imageSrc: "/assets/layout-card/database_layout_card.png",
    altText: "Image preview of Database layout",
  },
}
