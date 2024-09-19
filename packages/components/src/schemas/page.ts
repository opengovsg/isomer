import type { TSchema } from "@sinclair/typebox"

import type { IsomerSchema } from "~/types"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  FileRefPageSchema,
  HomePagePageSchema,
  LinkRefPageSchema,
} from "~/types"

const LAYOUT_PAGE_MAP = {
  article: ArticlePagePageSchema,
  content: ContentPagePageSchema,
  homepage: HomePagePageSchema,
  index: ContentPagePageSchema,
  link: LinkRefPageSchema,
  collection: CollectionPagePageSchema,
  file: FileRefPageSchema,
}

export const getLayoutPageSchema = (
  layout: IsomerSchema["layout"],
): TSchema => {
  return LAYOUT_PAGE_MAP[layout]
}
