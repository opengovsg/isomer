import type { Static } from "@sinclair/typebox"
import type { SimplifyDeep } from "type-fest"
import type {
  ArticlePagePageProps,
  CollectionPagePageProps,
  ContentPagePageProps,
  DatabasePagePageProps,
  FileRefPageProps,
  HomePagePageProps,
  LinkRefPageProps,
  NotFoundPagePageProps,
  SearchPagePageProps,
} from "~/types"
import { Type } from "@sinclair/typebox"
import { ISOMER_PAGE_LAYOUTS } from "~/types/constants"

import type { NotFoundPageMetaProps, SearchPageMetaProps } from "./meta"
import type { IsomerSiteProps } from "./site"
import { IsomerComponentsSchemas } from "./components"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  DatabasePageMetaSchema,
  FileRefMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
  SearchPageMetaSchema,
} from "./meta"
import {
  ArticlePagePageSchema,
  CollectionPagePageSchema,
  ContentPagePageSchema,
  DatabasePagePageSchema,
  FileRefPageSchema,
  HomePagePageSchema,
  IndexPagePageSchema,
  LinkRefPageSchema,
  SearchPagePageSchema,
} from "./page"

const BaseItemSchema = Type.Object({
  version: Type.String({
    default: "0.1.0",
    description: "The version of the Isomer Next schema to use",
  }),
})

export const ArticlePageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Article, {
      default: ISOMER_PAGE_LAYOUTS.Article,
    }),
    meta: Type.Optional(ArticlePageMetaSchema),
    page: ArticlePagePageSchema,
  },
  {
    description:
      "Designed for the perfect reading experience. Use this layout for text-heavy content, such as news, press releases, and speeches",
    title: "Article",
  },
)

export const CollectionPageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      default: [],
      description:
        "This should be empty for collection pages, make sure to remove any items here.",
      maxItems: 0,
      minItems: 0,
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Collection, {
      default: ISOMER_PAGE_LAYOUTS.Collection,
    }),
    meta: Type.Optional(CollectionPageMetaSchema),
    page: CollectionPagePageSchema,
  },
  {
    description:
      "Use this layout for displaying a list of items, such as events, publications, or news articles.",
    title: "Collection",
  },
)

export const ContentPageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Content, {
      default: ISOMER_PAGE_LAYOUTS.Content,
    }),
    meta: Type.Optional(ContentPageMetaSchema),
    page: ContentPagePageSchema,
  },
  {
    description: "This is the most basic layout for your content.",
    title: "Default",
  },
)

export const HomePageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Homepage, {
      default: ISOMER_PAGE_LAYOUTS.Homepage,
    }),
    meta: Type.Optional(HomePageMetaSchema),
    page: HomePagePageSchema,
  },
  {
    description: "This is the main landing page for your site.",
    title: "Homepage",
  },
)

export const SearchPageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Search, {
      default: ISOMER_PAGE_LAYOUTS.Search,
    }),
    meta: Type.Optional(SearchPageMetaSchema),
    page: SearchPagePageSchema,
  },
  {
    description: "This is the search page for your site.",
    title: "Search",
  },
)

export const IndexPageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Index, {
      default: ISOMER_PAGE_LAYOUTS.Index,
    }),
    meta: Type.Optional(ContentPageMetaSchema),
    page: IndexPagePageSchema,
  },
  {
    description:
      "This is a special type of content page layout that is for index pages.",
    title: "Default",
  },
)

export const DatabasePageSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Database, {
      default: ISOMER_PAGE_LAYOUTS.Database,
    }),
    meta: Type.Optional(DatabasePageMetaSchema),
    page: DatabasePagePageSchema,
  },
  {
    description:
      "This is a special kind of content page that also displays a searchable database of items at the bottom of the page.",
    title: "Database",
  },
)

export const FileRefSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      default: [],
      description:
        "This should be empty for file pages, make sure to remove any items here.",
      maxItems: 0,
      minItems: 0,
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.File, {
      default: ISOMER_PAGE_LAYOUTS.File,
    }),
    meta: Type.Optional(FileRefMetaSchema),
    page: FileRefPageSchema,
  },
  {
    description:
      "This is a layout used exclusively within collections. Use this layout if you want to link to a file, such as a PDF or a Word document, from within a Collection page.",
    title: "File Reference",
  },
)

export const LinkRefSchema = Type.Object(
  {
    content: Type.Array(IsomerComponentsSchemas, {
      default: [],
      description:
        "This should be empty for link pages, make sure to remove any items here.",
      maxItems: 0,
      minItems: 0,
      title: "Page content",
    }),
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.Link, {
      default: ISOMER_PAGE_LAYOUTS.Link,
    }),
    meta: Type.Optional(LinkRefMetaSchema),
    page: LinkRefPageSchema,
  },
  {
    description:
      "This is a layout used exclusively within collections. Use this layout if you want to link to an external page from within a Collection page.",
    title: "Link Reference",
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
    SearchPageSchema,
    IndexPageSchema,
    FileRefSchema,
    LinkRefSchema,
  ]),
])

export type IsomerSchema = SimplifyDeep<Static<typeof IsomerPageSchema>>

// These props are required by the render engine, but are not enforced by the
// JSON schema, as the data should be provided by the template directly
interface BasePageAdditionalProps {
  site: IsomerSiteProps
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
