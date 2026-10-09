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

export const getLayoutPageSchema = (layout: IsomerPageLayoutType): TSchema => {
  // A new object. The map entry stays nested in the page schema without a second `$id`.
  return attachIsomerSharedDefinitions(LAYOUT_PAGE_MAP[layout])
}
