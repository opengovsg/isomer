export interface SchemaImageComponent {
  type: string
  alt?: string
  src?: string
}

export interface ContentPageHeader {
  summary?: string | string[]
}

export interface ArticlePageHeader {
  summary?: string
}

export interface CollectionPagePageProps {
  defaultSortBy?: string
  defaultSortDirection?: string
}

export interface SchemaPage {
  title?: string
  category?: string
  date?: string
  image?: { src?: string; alt?: string }
  contentPageHeader?: ContentPageHeader
  articlePageHeader?: ArticlePageHeader
  subtitle?: string
  description?: string
  tags?: string[]
  collectionPagePageProps?: CollectionPagePageProps
  ref?: string
}

export interface SchemaData {
  page: SchemaPage
  layout: string
  content?: SchemaImageComponent[]
  order?: string[]
  version?: string
}

export interface SitemapImage {
  alt?: string
  src?: string
}

export interface SitemapEntry {
  category?: string
  date?: string
  image?: SitemapImage
  lastModified: Date
  layout: string
  permalink: string
  summary: string
  tags?: string[]
  title: string
  collectionPagePageProps?: CollectionPagePageProps
  fileDetails?: { size: string; type: string }
  ref?: string
  children?: SitemapEntry[]
}
