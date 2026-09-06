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
  collection: CollectionPageMetaSchema,
  content: ContentPageMetaSchema,
  database: DatabasePageMetaSchema,
  file: FileRefMetaSchema,
  homepage: HomePageMetaSchema,
  index: ContentPageMetaSchema,
  link: LinkRefMetaSchema,
  notfound: NotFoundPageMetaSchema,
  search: SearchPageMetaSchema,
}

export const getLayoutMetadataSchema = (
  layout: IsomerPageLayoutType,
): TSchema => LAYOUT_METADATA_MAP[layout]
