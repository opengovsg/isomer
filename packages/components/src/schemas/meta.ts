import type { TSchema } from "@sinclair/typebox"
import type { IsomerPageLayoutType } from "~/types"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  DatabasePageMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
  NotFoundPageMetaSchema,
  SearchPageMetaSchema,
} from "~/types"

import { attachIsomerSharedDefinitions } from "./sharedDefinitions"

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
}

export const getLayoutMetadataSchema = (
  layout: IsomerPageLayoutType,
): TSchema => {
  return attachIsomerSharedDefinitions(LAYOUT_METADATA_MAP[layout])
}
