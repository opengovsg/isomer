export interface Resource {
  id: string
  title: string
  permalink: string
  parentId: number | null
  type: string
  content?: any
  fullPermalink: string
}

interface Tag {
  label: string
  category: string
  values: string[]
}

export type SitemapEntry = Pick<Resource, "id" | "title" | "permalink"> & {
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
