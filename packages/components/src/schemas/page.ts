import type { IsomerPageLayoutType } from "~/types"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  DatabasePagePageSchema,
  FileRefPageSchema,
  HomePagePageSchema,
  IndexPagePageSchema,
  LinkRefPageSchema,
  NotFoundPagePageSchema,
  SearchPagePageSchema,
} from "~/types"

export const LAYOUT_PAGE_MAP = {
  article: ArticlePagePageSchema,
  collection: CollectionPagePageSchema,
  content: ContentPagePageSchema,
  database: DatabasePagePageSchema,
  file: FileRefPageSchema,
  homepage: HomePagePageSchema,
  index: IndexPagePageSchema,
  link: LinkRefPageSchema,
  notfound: NotFoundPagePageSchema,
  search: SearchPagePageSchema,
} as const

export const getLayoutPageSchema = (layout: IsomerPageLayoutType) =>
  LAYOUT_PAGE_MAP[layout]
