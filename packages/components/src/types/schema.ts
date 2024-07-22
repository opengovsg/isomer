import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type {
  ArticlePageProps,
  CollectionPageProps,
  ContentPageProps,
  FileRefProps,
  HomePageProps,
  LinkRefProps,
  NotFoundPageProps,
  SearchPageProps,
} from "./page"
import type { IsomerSiteProps } from "./site"
import { IsomerComponentsSchemas } from "./components"
import {
  ArticlePageMetaSchema,
  CollectionPageMetaSchema,
  ContentPageMetaSchema,
  FileRefMetaSchema,
  HomePageMetaSchema,
  LinkRefMetaSchema,
} from "./page"

export const ISOMER_USABLE_PAGE_LAYOUTS = {
  Article: "article",
  Collection: "collection",
  Content: "content",
  Homepage: "homepage",
  File: "file",
  Link: "link",
} as const

export const ISOMER_PAGE_LAYOUTS = {
  ...ISOMER_USABLE_PAGE_LAYOUTS,
  NotFound: "notfound",
  Search: "search",
} as const

const BasePageSchema = Type.Object({
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
    page: ArticlePageMetaSchema,
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
    page: CollectionPageMetaSchema,
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
    page: ContentPageMetaSchema,
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
    page: HomePageMetaSchema,
    content: Type.Array(IsomerComponentsSchemas, {
      title: "Page content",
    }),
  },
  {
    title: "Homepage",
    description: "This is the main landing page for your site.",
  },
)

export const FileRefSchema = Type.Object(
  {
    layout: Type.Literal(ISOMER_PAGE_LAYOUTS.File, {
      default: ISOMER_PAGE_LAYOUTS.File,
    }),
    page: FileRefMetaSchema,
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
    page: LinkRefMetaSchema,
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

export type IsomerSchema = Static<typeof IsomerPageSchema>

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
