import type { IsomerPageLayoutType } from "~/types"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  DatabasePagePageSchema,
  FileRefPageSchema,
  HomePagePageSchema,
  LinkRefPageSchema,
  NotFoundPagePageSchema,
  SearchPagePageSchema,
} from "~/types"

export const LAYOUT_PAGE_MAP = {
  article: ArticlePagePageSchema,
  content: ContentPagePageSchema,
  database: DatabasePagePageSchema,
  homepage: HomePagePageSchema,
  index: ContentPagePageSchema,
  notfound: NotFoundPagePageSchema,
  search: SearchPagePageSchema,
  link: LinkRefPageSchema,
  collection: CollectionPagePageSchema,
  file: FileRefPageSchema,
} as const

export const getLayoutPageSchema = (layout: IsomerPageLayoutType) => {
  return LAYOUT_PAGE_MAP[layout]
}
