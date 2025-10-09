import type { LinkComponentType } from "~/types"

export interface Page {
  title: string
  url: string
}

export interface PagerProps {
  previousPage?: Page
  nextPage?: Page
  LinkComponent?: LinkComponentType
}
