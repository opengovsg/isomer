import type { LinkComponentType } from "~/types"

export interface Page {
  title: string
  url: string
  isCurrent?: boolean
}

export interface SiderailProps {
  parentTitle: string
  parentUrl: string
  pages: Page[]
  LinkComponent?: LinkComponentType
}
