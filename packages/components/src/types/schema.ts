import { Type, type Static } from "@sinclair/typebox"
import { IsomerComponentsSchemas } from "./components"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  FileRefMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
  type ArticlePageProps,
  type CollectionPageProps,
  type ContentPageProps,
  type FileRefProps,
  type HomePageProps,
  type LinkRefProps,
  type NotFoundPageProps,
  type SearchPageProps,
} from "./page"
import type { IsomerSiteProps } from "./site"

export const ISOMER_PAGE_LAYOUTS = {
  Article: "article",
  Collection: "collection",
  Content: "content",
  Homepage: "homepage",
  NotFound: "notfound",
  Search: "search",
  File: "file",
  Link: "link",
} as const

const BasePageSchema = Type.Object({
  version: Type.String({
    description: "The version of the Isomer Next schema to use",
  }),
})

export const ArticlePageSchema = Type.Object({
  layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Article),
  page: ArticlePageMetaSchema,
  content: Type.Array(IsomerComponentsSchemas, {
    title: "Page content",
  }),
})

export const CollectionPageSchema = Type.Object({
  layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Collection),
  page: CollectionPageMetaSchema,
  content: Type.Array(Type.Null(), {
    title: "Page content",
    description:
      "This should be empty for collection pages, make sure to remove any items here.",
    default: [],
    minItems: 0,
    maxItems: 0,
  }),
})

export const ContentPageSchema = Type.Object({
  layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Content),
  page: ContentPageMetaSchema,
  content: Type.Array(IsomerComponentsSchemas, {
    title: "Page content",
  }),
})

export const HomePageSchema = Type.Object({
  layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Homepage),
  page: HomePageMetaSchema,
  content: Type.Array(IsomerComponentsSchemas, {
    title: "Page content",
  }),
})

export const FileRefSchema = Type.Object({
  layout: Type.Literal(ISOMER_PAGE_LAYOUTS.File),
  page: FileRefMetaSchema,
  content: Type.Array(Type.Null(), {
    title: "Page content",
    description:
      "This should be empty for file pages, make sure to remove any items here.",
    default: [],
    minItems: 0,
    maxItems: 0,
  }),
})

export const LinkRefSchema = Type.Object({
  layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Link),
  page: LinkRefMetaSchema,
  content: Type.Array(Type.Null(), {
    title: "Page content",
    description:
      "This should be empty for link pages, make sure to remove any items here.",
    default: [],
    minItems: 0,
    maxItems: 0,
  }),
})

export const IsomerPageSchema = Type.Intersect([
  BasePageSchema,
  Type.Union([
    ArticlePageSchema,
    CollectionPageSchema,
    ContentPageSchema,
    HomePageSchema,
    FileRefSchema,
    LinkRefSchema,
  ]),
])

interface BasePageAdditionalProps {
  site: IsomerSiteProps
  LinkComponent?: any // Next.js link
  ScriptComponent?: any // Next.js script
}

export interface NotFoundPageSchemaType extends BasePageAdditionalProps {
  layout: typeof ISOMER_PAGE_LAYOUTS.NotFound
  page: NotFoundPageProps
}

export interface SearchPageSchemaType extends BasePageAdditionalProps {
  layout: typeof ISOMER_PAGE_LAYOUTS.Search
  page: SearchPageProps
}

export type ArticlePageSchemaType = Static<typeof ArticlePageSchema> &
  BasePageAdditionalProps & {
    page: ArticlePageProps
  }
export type CollectionPageSchemaType = Static<typeof CollectionPageSchema> &
  BasePageAdditionalProps & {
    page: CollectionPageProps
  }
export type ContentPageSchemaType = Static<typeof ContentPageSchema> &
  BasePageAdditionalProps & {
    page: ContentPageProps
  }
export type HomePageSchemaType = Static<typeof HomePageSchema> &
  BasePageAdditionalProps & {
    page: HomePageProps
  }
export type FileRefSchemaType = Static<typeof FileRefSchema> &
  BasePageAdditionalProps & {
    page: FileRefProps
  }
export type LinkRefSchemaType = Static<typeof LinkRefSchema> &
  BasePageAdditionalProps & {
    page: LinkRefProps
  }

export type IsomerPageSchemaType =
  | ArticlePageSchemaType
  | CollectionPageSchemaType
  | ContentPageSchemaType
  | HomePageSchemaType
  | NotFoundPageSchemaType
  | SearchPageSchemaType
  | FileRefSchemaType
  | LinkRefSchemaType
