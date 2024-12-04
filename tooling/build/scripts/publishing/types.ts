import { Resource as DbResource } from "~generated/selectableTypes"

// NOTE: this needs the `omit` because the `parentId`
// we defined in studio
export interface Resource extends Omit<DbResource, "parentId"> {
  parentId: number | null
  content?: any
  fullPermalink: string
}

interface Tag {
  label: string
  category: string
  values: string[]
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
  image?: string
  ref?: string
  children?: SitemapEntry[]
  tags?: Tag[]
}
