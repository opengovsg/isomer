import type { LinkComponentType } from "~/types"

export interface HeadingLink {
  content: string
  anchorLink: string
}

export interface TableOfContentsProps {
  items: HeadingLink[]
  LinkComponent?: LinkComponentType
}
