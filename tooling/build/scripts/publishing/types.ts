import { Resource as DbResource } from "~generated/selectableTypes"

import { PAGE_RESOURCE_TYPES } from "./constants"

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
  tagCategories?: TagCategory[]
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
  ref?: string
  children?: SitemapEntry[]
  tags?: Tag[]
  tagged?: Tagged[]
  collectionPagePageProps?: CollectionPagePageProps
}

export type PageOnlySitemapEntry = Omit<SitemapEntry, "children"> & {
  type: (typeof PAGE_RESOURCE_TYPES)[number]
}
