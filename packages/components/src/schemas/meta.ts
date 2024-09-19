import type { TSchema } from "@sinclair/typebox"

import type { IsomerSchema } from "~/types"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  FileRefMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
} from "~/types"

const LAYOUT_METADATA_MAP = {
  article: ArticlePageMetaSchema,
  content: ContentPageMetaSchema,
  homepage: HomePageMetaSchema,
  index: ContentPageMetaSchema,
  link: LinkRefMetaSchema,
  collection: CollectionPageMetaSchema,
  file: FileRefMetaSchema,
}

export const getLayoutMetadataSchema = (
  layout: IsomerSchema["layout"],
): TSchema => {
  return LAYOUT_METADATA_MAP[layout]
}
