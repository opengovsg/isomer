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

const contentPageMetaSchema = attachIsomerSharedDefinitions(
  ContentPageMetaSchema,
)

const LAYOUT_METADATA_SCHEMAS = {
  article: attachIsomerSharedDefinitions(ArticlePageMetaSchema),
  content: contentPageMetaSchema,
  database: attachIsomerSharedDefinitions(DatabasePageMetaSchema),
  homepage: attachIsomerSharedDefinitions(HomePageMetaSchema),
  index: contentPageMetaSchema,
  notfound: attachIsomerSharedDefinitions(NotFoundPageMetaSchema),
  search: attachIsomerSharedDefinitions(SearchPageMetaSchema),
  link: attachIsomerSharedDefinitions(LinkRefMetaSchema),
  collection: attachIsomerSharedDefinitions(CollectionPageMetaSchema),
} as const

export const getLayoutMetadataSchema = (
  layout: IsomerPageLayoutType,
): TSchema => {
  return LAYOUT_METADATA_SCHEMAS[layout]
}
