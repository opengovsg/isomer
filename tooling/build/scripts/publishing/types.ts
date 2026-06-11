import type { Resource as DbResource } from "~generated/selectableTypes"

import type { PAGE_RESOURCE_TYPES } from "./constants"

// NOTE: this needs the `omit` because the `parentId`
// we defined in studio
export interface Resource extends Omit<DbResource, "parentId"> {
  parentId: number | null
  content?: any
  fullPermalink: string
}

interface Tag {
  selected: string[]
  category: string
}

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
  // `showThumbnail` is read opportunistically from page content and written
  // into the sitemap entry by buildPageSitemapEntry; declared here so the
  // (previously untypechecked) projection in sitemap.ts typechecks.
  showThumbnail?: boolean
}

export type SitemapEntry = Pick<
  Resource,
  "id" | "title" | "permalink" | "type"
> & {
  lastModified: string
  layout: string
  summary: string
  category?: string
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
  tags?: Tag[]
  tagged?: Tagged[]
  collectionPagePageProps?: CollectionPagePageProps
}

export type PageOnlySitemapEntry = Omit<SitemapEntry, "children"> & {
  type: (typeof PAGE_RESOURCE_TYPES)[number]
}
