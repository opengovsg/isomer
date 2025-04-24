import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { NotFoundPageMetaProps, SearchPageMetaProps } from "./meta"
import type { IsomerSiteProps } from "./site"
import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  ContentPagePageProps,
  DatabasePagePageProps,
  FileRefPageProps,
  HomePagePageProps,
  LinkComponentType,
  LinkRefPageProps,
  NotFoundPagePageProps,
  ScriptComponentType,
  SearchPagePageProps,
} from "~/types"
import { IsomerComponentsSchemas } from "./components"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  DatabasePageMetaSchema,
  FileRefMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
} from "./meta"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  DatabasePagePageSchema,
  FileRefPageSchema,
  HomePagePageSchema,
  LinkRefPageSchema,
} from "./page"

export const ISOMER_USABLE_PAGE_LAYOUTS = {
  Article: "article",
  Collection: "collection",
  Content: "content",
  Homepage: "homepage",
  Index: "index",
  Database: "database",
  File: "file",
  Link: "link",
} as const

export const ISOMER_PAGE_LAYOUTS = {
  ...ISOMER_USABLE_PAGE_LAYOUTS,
  NotFound: "notfound",
  Search: "search",
} as const

const BaseItemSchema = Type.Object({
  version: Type.String({
    description: "The version of the Isomer Next schema to use",
    default: "0.1.0",
  }),
})

export const ArticlePageSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Article, {
      default: ISOMER_PAGE_LAYOUTS.Article,
    }),
    meta: Type.Optional(ArticlePageMetaSchema),
    page: ArticlePagePageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
  },
  {
    title: "Article",
    description:
      "Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches",
  },
)

export const CollectionPageSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Collection, {
      default: ISOMER_PAGE_LAYOUTS.Collection,
    }),
    meta: Type.Optional(CollectionPageMetaSchema),
    page: CollectionPagePageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
      description:
        "This should be empty for collection pages, make sure to remove any items here.",
      default: [],
      minItems: 0,
      maxItems: 0,
    }),
  },
  {
    title: "Collection",
    description:
      "Use this layout for displaying a list of items, such as events, publications, or news articles.",
  },
)

export const ContentPageSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Content, {
      default: ISOMER_PAGE_LAYOUTS.Content,
    }),
    meta: Type.Optional(ContentPageMetaSchema),
    page: ContentPagePageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
  },
  {
    title: "Default",
    description: "This is the most basic layout for your content.",
  },
)

export const HomePageSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Homepage, {
      default: ISOMER_PAGE_LAYOUTS.Homepage,
    }),
    meta: Type.Optional(HomePageMetaSchema),
    page: HomePagePageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
  },
  {
    title: "Homepage",
    description: "This is the main landing page for your site.",
  },
)

export const IndexPageSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Index, {
      default: ISOMER_PAGE_LAYOUTS.Index,
    }),
    meta: Type.Optional(ContentPageMetaSchema),
    page: ContentPagePageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
  },
  {
    title: "Default",
    description:
      "This is a special type of content page layout that is for index pages.",
  },
)

export const DatabasePageSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Database, {
      default: ISOMER_PAGE_LAYOUTS.Database,
    }),
    meta: Type.Optional(DatabasePageMetaSchema),
    page: DatabasePagePageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
  },
  {
    title: "Database",
    description:
      "This is a special kind of content page that also displays a searchable database of items at the bottom of the page.",
  },
)

export const FileRefSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.File, {
      default: ISOMER_PAGE_LAYOUTS.File,
    }),
    meta: Type.Optional(FileRefMetaSchema),
    page: FileRefPageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
      description:
        "This should be empty for file pages, make sure to remove any items here.",
      default: [],
      minItems: 0,
      maxItems: 0,
    }),
  },
  {
    title: "File Reference",
    description:
      "This is a layout used exclusively within collections. Use this layout if you want to link to a file, such as a PDF or a Word document, from within a Collection page.",
  },
)

export const LinkRefSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Link, {
      default: ISOMER_PAGE_LAYOUTS.Link,
    }),
    meta: Type.Optional(LinkRefMetaSchema),
    page: LinkRefPageSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
      description:
        "This should be empty for link pages, make sure to remove any items here.",
      default: [],
      minItems: 0,
      maxItems: 0,
    }),
  },
  {
    title: "Link Reference",
    description:
      "This is a layout used exclusively within collections. Use this layout if you want to link to an external page from within a Collection page.",
  },
)

export const IsomerPageSchema = Type.Composite([
  BaseItemSchema,
  Type.Union([
    ArticlePageSchema,
    CollectionPageSchema,
    ContentPageSchema,
    DatabasePageSchema,
    HomePageSchema,
    IndexPageSchema,
    FileRefSchema,
    LinkRefSchema,
  ]),
])

export type IsomerSchema = Static<typeof IsomerPageSchema>

// These props are required by the render engine, but are not enforced by the
// JSON schema, as the data should be provided by the template directly
export interface BasePageAdditionalProps {
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
  ScriptComponent?: ScriptComponentType
  fromStudio?: boolean
}

export interface NotFoundPageSchemaType extends BasePageAdditionalProps {
  layout: typeof ISOMER_PAGE_LAYOUTS.NotFound
  meta?: NotFoundPageMetaProps
  page: NotFoundPagePageProps
}

export interface SearchPageSchemaType extends BasePageAdditionalProps {
  layout: typeof ISOMER_PAGE_LAYOUTS.Search
  meta?: SearchPageMetaProps
  page: SearchPagePageProps
}

export type ArticlePageSchemaType = Static<typeof ArticlePageSchema> &
  BasePageAdditionalProps & {
    page: ArticlePagePageProps
  }
export type CollectionPageSchemaType = Static<typeof CollectionPageSchema> &
  BasePageAdditionalProps & {
    page: CollectionPagePageProps
  }
export type ContentPageSchemaType = Static<typeof ContentPageSchema> &
  BasePageAdditionalProps & {
    page: ContentPagePageProps
  }
export type DatabasePageSchemaType = Static<typeof DatabasePageSchema> &
  BasePageAdditionalProps & {
    page: DatabasePagePageProps
  }
export type HomePageSchemaType = Static<typeof HomePageSchema> &
  BasePageAdditionalProps & {
    page: HomePagePageProps
  }

export type IndexPageSchemaType = Static<typeof IndexPageSchema> &
  BasePageAdditionalProps & {
    page: ContentPagePageProps
  }
export type FileRefSchemaType = Static<typeof FileRefSchema> &
  BasePageAdditionalProps & {
    page: FileRefPageProps
  }
export type LinkRefSchemaType = Static<typeof LinkRefSchema> &
  BasePageAdditionalProps & {
    page: LinkRefPageProps
  }

export type IsomerPageSchemaType =
  | ArticlePageSchemaType
  | CollectionPageSchemaType
  | ContentPageSchemaType
  | DatabasePageSchemaType
  | HomePageSchemaType
  | IndexPageSchemaType
  | NotFoundPageSchemaType
  | SearchPageSchemaType
  | FileRefSchemaType
  | LinkRefSchemaType

export type IsomerPageLayoutType = IsomerPageSchemaType["layout"]
