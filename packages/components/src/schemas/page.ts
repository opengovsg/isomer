import type { IsomerPageLayoutType } from "~/types"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  DatabasePagePageSchema,
  HomePagePageSchema,
  IndexPagePageSchema,
  LinkRefPageSchema,
  NotFoundPagePageSchema,
  SearchPagePageSchema,
} from "~/types"

export const LAYOUT_PAGE_MAP = {
  article: ArticlePagePageSchema,
  content: ContentPagePageSchema,
  database: DatabasePagePageSchema,
  homepage: HomePagePageSchema,
  index: IndexPagePageSchema,
  notfound: NotFoundPagePageSchema,
  search: SearchPagePageSchema,
  link: LinkRefPageSchema,
  collection: CollectionPagePageSchema,
} as const

export const getLayoutPageSchema = (layout: IsomerPageLayoutType) => {
  return LAYOUT_PAGE_MAP[layout]
}
