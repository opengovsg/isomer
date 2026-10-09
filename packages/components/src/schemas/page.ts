import type { TSchema } from "@sinclair/typebox"
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

import { attachIsomerSharedDefinitions } from "./sharedDefinitions"

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

// Attached once. The map entries stay nested in the page schema without a second `$id`.
const LAYOUT_PAGE_SCHEMAS = {
  article: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.article),
  content: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.content),
  database: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.database),
  homepage: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.homepage),
  index: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.index),
  notfound: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.notfound),
  search: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.search),
  link: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.link),
  collection: attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP.collection),
} as const

export const getLayoutPageSchema = (layout: IsomerPageLayoutType): TSchema => {
  return LAYOUT_PAGE_SCHEMAS[layout]
}
