import type { TSchema } from "@sinclair/typebox"

import type { IsomerPageLayoutType } from "~/types"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  FileRefPageSchema,
  HomePagePageSchema,
  LinkRefPageSchema,
  NotFoundPagePageSchema,
  SearchPagePageSchema,
} from "~/types"

const LAYOUT_PAGE_MAP = {
  article: ArticlePagePageSchema,
  content: ContentPagePageSchema,
  homepage: HomePagePageSchema,
  index: ContentPagePageSchema,
  notfound: NotFoundPagePageSchema,
  search: SearchPagePageSchema,
  link: LinkRefPageSchema,
  collection: CollectionPagePageSchema,
  file: FileRefPageSchema,
}

export const getLayoutPageSchema = (layout: IsomerPageLayoutType): TSchema => {
  return LAYOUT_PAGE_MAP[layout]
}
