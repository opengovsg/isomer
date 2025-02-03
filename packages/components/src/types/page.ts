import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { CollectionVariant } from "./variants"
import {
  ArticlePageHeaderSchema,
  ContentPageHeaderSchema,
  SearchableTableSchema,
} from "~/interfaces"
import { AltTextSchema, generateImageSrcSchema } from "~/interfaces/complex"
import { REF_HREF_PATTERN } from "~/utils/validation"

const categorySchemaObject = Type.Object({
  category: Type.String({
    title: "Article category",
    format: "category",
    description:
      "The category is used for filtering in the parent collection page",
  }),
})

const dateSchemaObject = Type.Object({
  date: Type.Optional(
    Type.String({
      title: "Article date",
      format: "date",
    }),
  ),
})

const imageSchemaObject = Type.Object({
  image: Type.Optional(
    Type.Object({
      src: generateImageSrcSchema({
        description:
          "Displayed at the top of the page and as a thumbnail in the collection view",
      }),
      alt: AltTextSchema,
    }),
  ),
})

const BaseRefPageSchema = Type.Composite([
  categorySchemaObject,
  dateSchemaObject,
  imageSchemaObject,
  Type.Object({
    ref: Type.String({
      title: "Link",
      description: "Choose a page or file to link to this Collection item",
      format: "ref",
      pattern: REF_HREF_PATTERN,
    }),
    description: Type.Optional(
      Type.String({
        title: "Summary",
        description:
          "Add a short description to explain what this collection item is about",
        format: "textarea",
        maxLength: 120,
      }),
    ),
  }),
])

const TagSchema = Type.Object({
  selected: Type.Array(Type.String()),
  category: Type.String(),
})

const TagsSchema = Type.Object({
  tags: Type.Optional(Type.Array(TagSchema)),
})

export const ArticlePagePageSchema = Type.Composite([
  dateSchemaObject,
  Type.Object({
    articlePageHeader: ArticlePageHeaderSchema,
  }),
  categorySchemaObject,
  imageSchemaObject,
])

export const CollectionPagePageSchema = Type.Intersect([
  Type.Object({
    subtitle: Type.String({
      title: "The subtitle of the collection",
    }),
  }),
  TagsSchema,
])

export const ContentPagePageSchema = Type.Object({
  contentPageHeader: ContentPageHeaderSchema,
})

export const DatabasePagePageSchema = Type.Object({
  contentPageHeader: ContentPageHeaderSchema,
  database: SearchableTableSchema,
})

export const HomePagePageSchema = Type.Object({})
export const NotFoundPagePageSchema = Type.Object({})
export const SearchPagePageSchema = Type.Object({})

export const FileRefPageSchema = BaseRefPageSchema
export const LinkRefPageSchema = Type.Omit(BaseRefPageSchema, ["image"])

// These are props that are required by the render engine, but not enforced by
// the JSON schema (as the data is being stored outside of the page JSON)
interface BaseItemAdditionalProps {
  permalink: string
  lastModified: string
  title: string
}
type BasePageAdditionalProps = BaseItemAdditionalProps & {
  language?: "en"
}

interface ArticlePageAdditionalProps {
  tags?: CollectionPagePageProps["tags"]
}

interface CollectionVariantProps {
  variant?: CollectionVariant
}

export type ArticlePagePageProps = Static<typeof ArticlePagePageSchema> &
  BasePageAdditionalProps &
  ArticlePageAdditionalProps
export type CollectionPagePageProps = Static<typeof CollectionPagePageSchema> &
  BasePageAdditionalProps &
  CollectionVariantProps
export type ContentPagePageProps = Static<typeof ContentPagePageSchema> &
  BasePageAdditionalProps
export type DatabasePagePageProps = Static<typeof DatabasePagePageSchema> &
  BasePageAdditionalProps
export type HomePagePageProps = Static<typeof HomePagePageSchema> &
  BasePageAdditionalProps
export type NotFoundPagePageProps = Static<typeof NotFoundPagePageSchema> &
  BasePageAdditionalProps
export type SearchPagePageProps = Static<typeof SearchPagePageSchema> &
  BasePageAdditionalProps

export type FileRefPageProps = Static<typeof FileRefPageSchema> &
  BaseItemAdditionalProps
export type LinkRefPageProps = Static<typeof LinkRefPageSchema> &
  BaseItemAdditionalProps
