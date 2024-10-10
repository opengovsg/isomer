import type { TSchema } from "@sinclair/typebox"

import type { IsomerPageLayoutType } from "~/types"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  DatabasePageMetaSchema,
  FileRefMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
  NotFoundPageMetaSchema,
  SearchPageMetaSchema,
} from "~/types"

const LAYOUT_METADATA_MAP = {
  article: ArticlePageMetaSchema,
  content: ContentPageMetaSchema,
  database: DatabasePageMetaSchema,
  homepage: HomePageMetaSchema,
  index: ContentPageMetaSchema,
  notfound: NotFoundPageMetaSchema,
  search: SearchPageMetaSchema,
  link: LinkRefMetaSchema,
  collection: CollectionPageMetaSchema,
  file: FileRefMetaSchema,
}

export const getLayoutMetadataSchema = (
  layout: IsomerPageLayoutType,
): TSchema => {
  return LAYOUT_METADATA_MAP[layout]
}
