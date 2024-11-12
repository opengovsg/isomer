import { ISOMER_PAGE_LAYOUTS } from "@opengovsg/isomer-components"

export const LAYOUT_TYPES = [
  ISOMER_PAGE_LAYOUTS.Content,
  ISOMER_PAGE_LAYOUTS.Article,
] as const
export type Layout = (typeof LAYOUT_TYPES)[number]

export const LAYOUT_RENDER_DATA: Record<
  Layout,
  {
    title: string
    description: string
    imageSrc: string
    altText: string
  }
> = {
  [ISOMER_PAGE_LAYOUTS.Content]: {
    title: "Default layout",
    description: "This is the most basic layout for your content.",
    imageSrc: "/assets/layout-card/default_layout_card.webp",
    altText: "Image preview of Default layout",
  },
  [ISOMER_PAGE_LAYOUTS.Article]: {
    title: "Article layout",
    description:
      "Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches.",
    imageSrc: "/assets/layout-card/article_layout_card.webp",
    altText: "Image preview of Article layout",
  },
}
