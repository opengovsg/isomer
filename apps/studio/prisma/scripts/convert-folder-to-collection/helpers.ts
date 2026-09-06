import type {
  ArticlePageSchemaType,
  ContentPageSchemaType,
  IndexPageSchemaType,
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"

// Mirrors PageEditor/constants — kept local so tsx does not load the full
// @opengovsg/isomer-components bundle (its dist still has unresolved `~` paths).
const ARTICLE_BLOCK_TYPES = [
  "prose",
  "image",
  "accordion",
  "callout",
  "blockquote",
  "imagegallery",
  "map",
  "video",
] as const

const CONTENT_BLOCK_TYPES = [
  ...ARTICLE_BLOCK_TYPES,
  "contentpic",
  "infobar",
  "infocards",
  "infocols",
  "keystatistics",
  "formsg",
] as const

export const ARTICLE_TYPES = new Set<string>(ARTICLE_BLOCK_TYPES)
export const CONTENT_TYPES = new Set<string>(CONTENT_BLOCK_TYPES)

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

export interface FolderPlan {
  id: string
  siteId: number
  title: string
  permalink: string
  defaultCategory: string
  indexPageId: string
  pageIds: string[]
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

export interface ConversionReportEntry {
  id: string
  reason: string
}

export const buildConversionReport = (
  plan: ConversionPlan,
): ConversionReportEntry[] =>
  plan.pages.flatMap((p) =>
    p.disallowedBlocks.length === 0
      ? []
      : [
          {
            id: p.resourceId,
            reason: `disallowed-in-article blocks: ${p.disallowedBlocks
              .map((b) => `${b.type}@${b.index}`)
              .join(", ")}`,
          },
        ],
  )

export const toFolderPlan = (plan: ConversionPlan): FolderPlan => ({
  id: plan.folder.id,
  siteId: plan.folder.siteId,
  title: plan.folder.title,
  permalink: plan.folder.permalink,
  defaultCategory: plan.defaultCategory,
  indexPageId: plan.indexPage.resourceId,
  pageIds: plan.pages.map((p) => p.resourceId),
})

export const findDisallowedBlocks = (content: IsomerComponent[]) =>
  content.flatMap((block, index) =>
    CONTENT_ONLY_TYPES.has(block.type) ? [{ index, type: block.type }] : [],
  )

/** Blob JSON omits render-time `site`; use layout-specific schema types for narrowing. */
type BlobOf<T> = Omit<T, "site">

export type IndexBlob = BlobOf<IndexPageSchemaType>
export type ContentBlob = BlobOf<ContentPageSchemaType>
export type ArticleBlob = BlobOf<ArticlePageSchemaType>
export type PageBlob = ContentBlob | ArticleBlob

interface PageWithContentHeader {
  contentPageHeader: { summary: string }
  image?: { src: string; alt: string }
}

const optionalPageImage = (page: PageWithContentHeader) => {
  if (!page.image) {
    return {}
  }
  return { image: page.image }
}

export const asIndexBlob = (s: IsomerSchema): IndexBlob => {
  if (s.layout !== "index") {
    throw new Error(`Expected layout="index", got "${s.layout}"`)
  }
  // SAFETY: layout discriminator confirms index page schema shape.
  // @ts-expect-error IsomerSchema union is wider than IndexBlob at compile time.
  return s as IndexBlob
}

export const asContentBlob = (s: IsomerSchema): ContentBlob => {
  if (s.layout !== "content") {
    throw new Error(`Expected layout="content", got "${s.layout}"`)
  }
  // SAFETY: layout discriminator confirms content page schema shape.
  // @ts-expect-error IsomerSchema union is wider than ContentBlob at compile time.
  return s as ContentBlob
}

export const asPageBlob = (s: IsomerSchema): PageBlob => {
  if (s.layout === "content") {
    // SAFETY: layout discriminator confirms content page schema shape.
    // @ts-expect-error IsomerSchema union is wider than ContentBlob at compile time.
    return s as ContentBlob
  }
  if (s.layout === "article") {
    // SAFETY: layout discriminator confirms article page schema shape.
    // @ts-expect-error IsomerSchema union is wider than ArticleBlob at compile time.
    return s as ArticleBlob
  }
  throw new Error(`Expected layout="content" or "article", got "${s.layout}"`)
}

export const buildCollectionIndexBlob = (
  current: IndexBlob,
  folderTitle: string,
): IsomerSchema => {
  const page = {
    title: folderTitle,
    subtitle: current.page.contentPageHeader.summary,
    sortOrder: "date-desc" as const,
    ...optionalPageImage(current.page),
  }
  const blob = {
    ...current,
    layout: "collection" as const,
    page,
    content: [],
  }
  // SAFETY: transforms a validated IndexBlob into collection layout per conversion rules.
  // @ts-expect-error collection layout blob is a valid IsomerSchema at runtime.
  return blob as IsomerSchema
}

export const buildArticleBlob = (
  current: PageBlob,
  defaultCategory: string,
): IsomerSchema => {
  if (current.layout === "article") {
    const blob = {
      ...current,
      layout: "article" as const,
      page: {
        ...current.page,
        category: defaultCategory,
      },
      content: current.content,
    }
    // SAFETY: article layout fields are preserved while updating category.
    // @ts-expect-error article layout blob is a valid IsomerSchema at runtime.
    return blob as IsomerSchema
  }

  const page = {
    category: defaultCategory,
    articlePageHeader: {
      summary: current.page.contentPageHeader.summary,
    },
    ...optionalPageImage(current.page),
  }
  const blob = {
    ...current,
    layout: "article" as const,
    page,
    content: current.content,
  }
  // SAFETY: content page fields are mapped to article layout per conversion rules.
  return blob as IsomerSchema
}
