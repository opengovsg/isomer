import type { Resource as DbResource } from "~generated/selectableTypes"

import type { PAGE_RESOURCE_TYPES } from "./constants"

// NOTE: this needs the `omit` because the `parentId`
// we defined in studio
export interface Resource extends Omit<DbResource, "parentId"> {
  parentId: number | null
  content?: any
  fullPermalink: string
}

// DEPRECATED: legacy resolved tags format — migrated to tagCategories/tagged.
// interface Tag {
//   selected: string[]
//   category: string
// }

interface Tagged {
  label: string
  id: string
}

type TagCategory = Tagged & {
  options: Tagged[]
}

interface CollectionPagePageProps {
  defaultSortBy?: string
  defaultSortDirection?: string
  sortOrder?: string
  tagCategories?: TagCategory[]
}

export type SitemapEntry = Pick<
  Resource,
  "id" | "title" | "permalink" | "type"
> & {
  lastModified: string
  layout: string
  summary: string
  // DEPRECATED: legacy page.category — migrated to tag categories. Do not re-add.
  // category?: string
  date?: string
  image?: {
    src?: string
    alt?: string
  }
  firstImage?: {
    src?: string
    alt?: string
  }
  ref?: string
  children?: SitemapEntry[]
  // DEPRECATED: legacy page.tags — migrated to tagCategories/tagged. Do not re-add.
  // tags?: Tag[]
  tagged?: string[]
  collectionPagePageProps?: CollectionPagePageProps
}

export type PageOnlySitemapEntry = Omit<SitemapEntry, "children"> & {
  type: (typeof PAGE_RESOURCE_TYPES)[number]
}
