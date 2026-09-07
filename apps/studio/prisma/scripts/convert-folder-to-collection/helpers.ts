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
  defaultCategory: plan.defaultCategory,
  id: plan.folder.id,
  indexPageId: plan.indexPage.resourceId,
  pageIds: plan.pages.map((p) => p.resourceId),
  permalink: plan.folder.permalink,
  siteId: plan.folder.siteId,
  title: plan.folder.title,
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
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  return s as IndexBlob
}

export const asContentBlob = (s: IsomerSchema): ContentBlob => {
  if (s.layout !== "content") {
    throw new Error(`Expected layout="content", got "${s.layout}"`)
  }
  // SAFETY: layout discriminator confirms content page schema shape.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  // @ts-expect-error IsomerSchema union is wider than ContentBlob at compile time.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  return s as ContentBlob
}

export const asPageBlob = (s: IsomerSchema): PageBlob => {
  if (s.layout === "content") {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    // SAFETY: layout discriminator confirms content page schema shape.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    // @ts-expect-error IsomerSchema union is wider than ContentBlob at compile time.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    return s as ContentBlob
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  if (s.layout === "article") {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    // SAFETY: layout discriminator confirms article page schema shape.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    // @ts-expect-error IsomerSchema union is wider than ArticleBlob at compile time.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    return s as ArticleBlob
  }
  throw new Error(`Expected layout="content" or "article", got "${s.layout}"`)
}

export const buildCollectionIndexBlob = (
  current: IndexBlob,
  folderTitle: string,
): IsomerSchema => {
  const page = {
    sortOrder: "date-desc" as const,
    subtitle: current.page.contentPageHeader.summary,
    title: folderTitle,
    ...optionalPageImage(current.page),
  }
  const blob = {
    ...current,
    content: [],
    layout: "collection" as const,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    page,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  // SAFETY: transforms a validated IndexBlob into collection layout per conversion rules.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  // @ts-expect-error collection layout blob is a valid IsomerSchema at runtime.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  return blob as IsomerSchema
}

export const buildArticleBlob = (
  current: PageBlob,
  defaultCategory: string,
): IsomerSchema => {
  if (current.layout === "article") {
    const blob = {
      ...current,
      content: current.content,
      layout: "article" as const,
      page: {
        ...current.page,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
        category: defaultCategory,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
      },
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    // SAFETY: article layout fields are preserved while updating category.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    // @ts-expect-error article layout blob is a valid IsomerSchema at runtime.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    return blob as IsomerSchema
  }

  const page = {
    articlePageHeader: {
      summary: current.page.contentPageHeader.summary,
    },
    category: defaultCategory,
    ...optionalPageImage(current.page),
  }
  const blob = {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    ...current,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    content: current.content,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    layout: "article" as const,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
    page,
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  }
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  // SAFETY: content page fields are mapped to article layout per conversion rules.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- boundary narrowing
  return blob as IsomerSchema
}
