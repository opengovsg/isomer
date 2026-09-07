import type { NEW_PAGE_LAYOUT_VALUES } from "~/schemas/page"

export type Layout = (typeof NEW_PAGE_LAYOUT_VALUES)[number]

export type LayoutRenderDataType = Record<
  Layout,
  {
    title: string
    description: string
    imageSrc: string
    altText: string
  }
>

export const LAYOUT_RENDER_DATA = {
  article: {
    altText: "Image preview of Article layout",
    description:
      "Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches.",
    imageSrc: "/assets/layout-card/article_layout_card.webp",
    title: "Article layout",
  },
  content: {
    altText: "Image preview of standard layout",
    description: "This is the default layout for your content.",
    imageSrc: "/assets/layout-card/default_layout_card.webp",
    title: "Standard layout",
  },
  database: {
    altText: "Image preview of Database layout",
    description: "Link your dataset from Data.gov.sg.",
    imageSrc: "/assets/layout-card/database_layout_card.png",
    title: "Database layout",
  },
} satisfies LayoutRenderDataType
