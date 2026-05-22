import type { Static } from "@sinclair/typebox"
import type {
  ContentPageSchema,
  IndexPageSchema,
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"

import {
  ARTICLE_ALLOWED_BLOCKS,
  CONTENT_ALLOWED_BLOCKS,
} from "~/components/PageEditor/constants"

export const flattenAllowedTypes = (
  sections: { types: IsomerComponent["type"][] }[],
): Set<string> => new Set(sections.flatMap((s) => s.types))

export const ARTICLE_TYPES = flattenAllowedTypes(ARTICLE_ALLOWED_BLOCKS)
export const CONTENT_TYPES = flattenAllowedTypes(CONTENT_ALLOWED_BLOCKS)

export const CONTENT_ONLY_TYPES = new Set(
  [...CONTENT_TYPES].filter((t) => !ARTICLE_TYPES.has(t)),
)

export interface PagePlan {
  resourceId: string
  title: string
  permalink: string
  currentBlobId: string
  currentBlob: IsomerSchema
  nextBlob: IsomerSchema
  disallowedBlocks: { index: number; type: IsomerComponent["type"] }[]
}

export interface ConversionPlan {
  folder: {
    id: string
    siteId: number
    title: string
    permalink: string
  }
  indexPage: PagePlan
  pages: PagePlan[]
  defaultCategory: string
}

export const findDisallowedBlocks = (content: IsomerComponent[]) =>
  content.flatMap((block, index) =>
    CONTENT_ONLY_TYPES.has(block.type) ? [{ index, type: block.type }] : [],
  )

export type IndexBlob = Static<typeof IndexPageSchema> & { version: string }
export type ContentBlob = Static<typeof ContentPageSchema> & { version: string }

export const asIndexBlob = (s: IsomerSchema): IndexBlob => {
  if (s.layout !== "index") {
    throw new Error(`Expected layout="index", got "${s.layout}"`)
  }
  return s as unknown as IndexBlob
}

export const asContentBlob = (s: IsomerSchema): ContentBlob => {
  if (s.layout !== "content") {
    throw new Error(`Expected layout="content", got "${s.layout}"`)
  }
  return s as unknown as ContentBlob
}

export const buildCollectionIndexBlob = (
  current: IndexBlob,
  folderTitle: string,
): IsomerSchema =>
  ({
    ...current,
    layout: "collection",
    page: {
      title: folderTitle,
      subtitle: current.page.contentPageHeader.summary,
      sortOrder: "date-desc",
      ...(current.page.image ? { image: current.page.image } : {}),
    },
    content: [],
  }) as IsomerSchema

export const buildArticleBlob = (
  current: ContentBlob,
  defaultCategory: string,
): IsomerSchema =>
  ({
    ...current,
    layout: "article",
    page: {
      category: defaultCategory,
      articlePageHeader: {
        summary: current.page.contentPageHeader.summary,
      },
      ...(current.page.image ? { image: current.page.image } : {}),
    },
    content: current.content,
  }) as IsomerSchema
