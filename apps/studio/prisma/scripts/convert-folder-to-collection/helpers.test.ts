import type {
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import {
  ARTICLE_TYPES,
  asContentBlob,
  asIndexBlob,
  asPageBlob,
  buildArticleBlob,
  buildCollectionIndexBlob,
  buildConversionReport,
  CONTENT_ONLY_TYPES,
  CONTENT_TYPES,
  findDisallowedBlocks,
  toFolderPlan,
  type ArticleBlob,
  type ContentBlob,
  type ConversionPlan,
  type IndexBlob,
} from "./helpers"

// Shape used purely for asserting on builder output without TypeScript
// narrowing on the `IsomerSchema` union for every property access.
interface BuilderResult {
  version: string
  layout: string
  page: Record<string, unknown>
  content: unknown[]
}

const asResult = (s: IsomerSchema): BuilderResult => s

const proseBlock: IsomerComponent = {
  type: "prose",
  content: [{ type: "paragraph", content: [{ type: "text", text: "hi" }] }],
}

const infobarBlock: IsomerComponent = {
  type: "infobar",
  title: "CTA",
  description: "Call-to-action",
}

const infocardsBlock: IsomerComponent = {
  type: "infocards",
  title: "Cards",
  variant: "cardsWithImages",
  maxColumns: "3",
  cards: [
    {
      title: "Card",
      url: "https://example.com",
      imageUrl: "/img.png",
      imageAlt: "alt",
      imageFit: "cover",
    },
  ],
}

interface PageOverrides {
  summary?: string
  image?: { src: string; alt: string }
}

const makeIndexBlob = (overrides?: PageOverrides): IndexBlob =>
  ({
    version: "0.1.0",
    layout: "index",
    page: {
      title: "Index",
      contentPageHeader: {
        summary: overrides?.summary ?? "Index summary",
        showThumbnail: false,
      },
      ...(overrides?.image ? { image: overrides.image } : {}),
    },
    content: [],
  }) as unknown as IndexBlob

const makeContentBlob = (
  overrides?: PageOverrides,
  content: IsomerComponent[] = [],
): ContentBlob =>
  ({
    version: "0.1.0",
    layout: "content",
    page: {
      title: "Page",
      contentPageHeader: {
        summary: overrides?.summary ?? "Content summary",
        showThumbnail: false,
      },
      ...(overrides?.image ? { image: overrides.image } : {}),
    },
    content,
  }) as unknown as ContentBlob

const makeArticleBlob = (
  overrides?: PageOverrides & { category?: string; date?: string },
  content: IsomerComponent[] = [],
): ArticleBlob =>
  ({
    version: "0.1.0",
    layout: "article",
    page: {
      title: "Article",
      category: overrides?.category ?? "News",
      date: overrides?.date ?? "1 Jan 2024",
      articlePageHeader: {
        summary: overrides?.summary ?? "Article summary",
      },
      ...(overrides?.image ? { image: overrides.image } : {}),
    },
    content,
  }) as unknown as ArticleBlob

const makeConversionPlan = (
  overrides?: Partial<ConversionPlan>,
): ConversionPlan => ({
  folder: {
    id: "159351",
    siteId: 1,
    title: "Folder",
    permalink: "folder",
  },
  defaultCategory: "Feature Articles",
  indexPage: {
    resourceId: "159352",
    title: "Index",
    permalink: "_index",
    currentBlobId: "blob-index",
    currentBlob: makeIndexBlob() as unknown as IsomerSchema,
    nextBlob: makeIndexBlob() as unknown as IsomerSchema,
    disallowedBlocks: [],
  },
  pages: [],
  ...overrides,
})

describe("buildConversionReport", () => {
  it("returns an empty array when no pages have disallowed blocks", () => {
    // Arrange
    const plan = makeConversionPlan({
      pages: [
        {
          resourceId: "1",
          title: "Clean page",
          permalink: "clean",
          currentBlobId: "b1",
          currentBlob: makeContentBlob() as unknown as IsomerSchema,
          nextBlob: makeArticleBlob() as unknown as IsomerSchema,
          disallowedBlocks: [],
        },
      ],
    })

    // Act + Assert
    expect(buildConversionReport(plan)).toEqual([])
  })

  it("emits one entry per page with disallowed blocks", () => {
    // Arrange
    const plan = makeConversionPlan({
      pages: [
        {
          resourceId: "159536",
          title: "Flagged",
          permalink: "flagged",
          currentBlobId: "b1",
          currentBlob: makeContentBlob({}, [
            infobarBlock,
          ]) as unknown as IsomerSchema,
          nextBlob: makeArticleBlob({}, [
            infobarBlock,
          ]) as unknown as IsomerSchema,
          disallowedBlocks: [{ index: 0, type: "infobar" }],
        },
        {
          resourceId: "159537",
          title: "Clean",
          permalink: "clean",
          currentBlobId: "b2",
          currentBlob: makeContentBlob() as unknown as IsomerSchema,
          nextBlob: makeArticleBlob() as unknown as IsomerSchema,
          disallowedBlocks: [],
        },
      ],
    })

    // Act
    const report = buildConversionReport(plan)

    // Assert
    expect(report).toEqual([
      {
        id: "159536",
        reason: "disallowed-in-article blocks: infobar@0",
      },
    ])
  })

  it("lists multiple disallowed blocks in the reason string", () => {
    // Arrange
    const plan = makeConversionPlan({
      pages: [
        {
          resourceId: "99",
          title: "Many flags",
          permalink: "many",
          currentBlobId: "b1",
          currentBlob: makeContentBlob({}, [
            infobarBlock,
            infocardsBlock,
          ]) as unknown as IsomerSchema,
          nextBlob: makeArticleBlob({}, [
            infobarBlock,
            infocardsBlock,
          ]) as unknown as IsomerSchema,
          disallowedBlocks: [
            { index: 0, type: "infobar" },
            { index: 1, type: "infocards" },
          ],
        },
      ],
    })

    // Act + Assert
    expect(buildConversionReport(plan)).toEqual([
      {
        id: "99",
        reason: "disallowed-in-article blocks: infobar@0, infocards@1",
      },
    ])
  })
})

describe("toFolderPlan", () => {
  it("maps folder metadata, default category, and child resource IDs", () => {
    // Arrange
    const plan = makeConversionPlan({
      pages: [
        {
          resourceId: "159536",
          title: "Page A",
          permalink: "a",
          currentBlobId: "b1",
          currentBlob: makeContentBlob() as unknown as IsomerSchema,
          nextBlob: makeArticleBlob() as unknown as IsomerSchema,
          disallowedBlocks: [],
        },
        {
          resourceId: "159537",
          title: "Page B",
          permalink: "b",
          currentBlobId: "b2",
          currentBlob: makeContentBlob() as unknown as IsomerSchema,
          nextBlob: makeArticleBlob() as unknown as IsomerSchema,
          disallowedBlocks: [],
        },
      ],
    })

    // Act
    const folderPlan = toFolderPlan(plan)

    // Assert
    expect(folderPlan).toEqual({
      id: "159351",
      siteId: 1,
      title: "Folder",
      permalink: "folder",
      defaultCategory: "Feature Articles",
      indexPageId: "159352",
      pageIds: ["159536", "159537"],
    })
  })
})

describe("ARTICLE_TYPES / CONTENT_TYPES / CONTENT_ONLY_TYPES", () => {
  it("ARTICLE_TYPES is a subset of CONTENT_TYPES (article blocks all live in content)", () => {
    // Act + Assert
    for (const t of ARTICLE_TYPES) {
      expect(CONTENT_TYPES.has(t)).toBe(true)
    }
  })

  it("CONTENT_ONLY_TYPES contains content types that are not allowed in articles", () => {
    // Act + Assert
    for (const t of CONTENT_ONLY_TYPES) {
      expect(CONTENT_TYPES.has(t)).toBe(true)
      expect(ARTICLE_TYPES.has(t)).toBe(false)
    }
  })

  it("CONTENT_ONLY_TYPES excludes blocks shared with the article layout", () => {
    // The article layout currently shares prose/image/callout/etc.
    // Act + Assert
    expect(CONTENT_ONLY_TYPES.has("prose")).toBe(false)
    expect(CONTENT_ONLY_TYPES.has("image")).toBe(false)
  })

  it("CONTENT_ONLY_TYPES flags content-only blocks like infobar and infocards", () => {
    // Act + Assert
    expect(CONTENT_ONLY_TYPES.has("infobar")).toBe(true)
    expect(CONTENT_ONLY_TYPES.has("infocards")).toBe(true)
  })
})

describe("findDisallowedBlocks", () => {
  it("returns an empty array when all blocks are article-allowed", () => {
    // Act
    const result = findDisallowedBlocks([proseBlock, proseBlock])

    // Assert
    expect(result).toEqual([])
  })

  it("flags blocks that are content-only with their index and type", () => {
    // Arrange
    const content = [proseBlock, infobarBlock, proseBlock, infocardsBlock]

    // Act
    const result = findDisallowedBlocks(content)

    // Assert
    expect(result).toEqual([
      { index: 1, type: "infobar" },
      { index: 3, type: "infocards" },
    ])
  })

  it("returns an empty array for an empty content array", () => {
    // Act + Assert
    expect(findDisallowedBlocks([])).toEqual([])
  })
})

describe("asIndexBlob", () => {
  it("returns the blob unchanged when layout is 'index'", () => {
    // Arrange
    const blob = makeIndexBlob() as unknown as IsomerSchema

    // Act
    const result = asIndexBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("throws when layout is not 'index'", () => {
    // Arrange
    const blob = makeContentBlob() as unknown as IsomerSchema

    // Act + Assert
    expect(() => asIndexBlob(blob)).toThrow(
      `Expected layout="index", got "content"`,
    )
  })
})

describe("asPageBlob", () => {
  it("returns content blobs unchanged", () => {
    // Arrange
    const blob = makeContentBlob() as unknown as IsomerSchema

    // Act
    const result = asPageBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("returns article blobs unchanged", () => {
    // Arrange
    const blob = makeArticleBlob() as unknown as IsomerSchema

    // Act
    const result = asPageBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("throws when layout is neither content nor article", () => {
    // Arrange
    const blob = makeIndexBlob() as unknown as IsomerSchema

    // Act + Assert
    expect(() => asPageBlob(blob)).toThrow(
      `Expected layout="content" or "article", got "index"`,
    )
  })
})

describe("asContentBlob", () => {
  it("returns the blob unchanged when layout is 'content'", () => {
    // Arrange
    const blob = makeContentBlob() as unknown as IsomerSchema

    // Act
    const result = asContentBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("throws when layout is not 'content'", () => {
    // Arrange
    const blob = makeIndexBlob() as unknown as IsomerSchema

    // Act + Assert
    expect(() => asContentBlob(blob)).toThrow(
      `Expected layout="content", got "index"`,
    )
  })
})

describe("buildCollectionIndexBlob", () => {
  it("flips layout to 'collection' and maps summary → subtitle", () => {
    // Arrange
    const current = makeIndexBlob({ summary: "Summary text" })

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder Title"))

    // Assert
    expect(result.layout).toBe("collection")
    expect(result.page).toMatchObject({
      title: "Folder Title",
      subtitle: "Summary text",
      sortOrder: "date-desc",
    })
  })

  it("preserves the image when present on the source page", () => {
    // Arrange
    const image = { src: "/img.png", alt: "alt" }
    const current = makeIndexBlob({ summary: "x", image })

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect(result.page.image).toEqual(image)
  })

  it("omits the image key entirely when the source page has none", () => {
    // Arrange
    const current = makeIndexBlob({ summary: "x" })

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect("image" in result.page).toBe(false)
  })

  it("empties the content array (collection pages have no body blocks)", () => {
    // Arrange
    const current = {
      ...makeIndexBlob({ summary: "x" }),
      content: [proseBlock, infobarBlock],
    } as unknown as IndexBlob

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect(result.content).toEqual([])
  })

  it("preserves the version field from the source blob", () => {
    // Arrange
    const current = makeIndexBlob({ summary: "x" })

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect(result.version).toBe("0.1.0")
  })

  it("drops contentPageHeader from the page object", () => {
    // Arrange
    const current = makeIndexBlob({ summary: "x" })

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect("contentPageHeader" in result.page).toBe(false)
  })

  it("uses the supplied folderTitle, overriding the source page title", () => {
    // Arrange — source has its own page.title "Index"
    const current = makeIndexBlob({ summary: "x" })

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder Title"))

    // Assert
    expect(result.page.title).toBe("Folder Title")
  })

  it("always emits sortOrder='date-desc'", () => {
    // Arrange — inject a different sortOrder on the source to verify it's overridden
    const current = {
      ...makeIndexBlob({ summary: "x" }),
      page: {
        ...makeIndexBlob({ summary: "x" }).page,
        sortOrder: "date-asc",
      },
    } as unknown as IndexBlob

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect(result.page.sortOrder).toBe("date-desc")
  })

  it("does not mutate the source blob", () => {
    // Arrange
    const current = makeIndexBlob({
      summary: "Original",
      image: { src: "/a.png", alt: "a" },
    })
    const snapshot = structuredClone(current)

    // Act
    buildCollectionIndexBlob(current, "Folder")

    // Assert
    expect(current).toEqual(snapshot)
  })
})

describe("buildArticleBlob", () => {
  it("flips layout to 'article' and maps summary → articlePageHeader.summary", () => {
    // Arrange
    const current = makeContentBlob({ summary: "Article summary" })

    // Act
    const result = asResult(buildArticleBlob(current, "News"))

    // Assert
    expect(result.layout).toBe("article")
    expect(result.page.articlePageHeader).toEqual({
      summary: "Article summary",
    })
  })

  it("applies the supplied default category", () => {
    // Arrange
    const current = makeContentBlob()

    // Act
    const result = asResult(buildArticleBlob(current, "Feature Articles"))

    // Assert
    expect(result.page.category).toBe("Feature Articles")
  })

  it("preserves the image when present on the source page", () => {
    // Arrange
    const image = { src: "/img.png", alt: "alt" }
    const current = makeContentBlob({ summary: "x", image })

    // Act
    const result = asResult(buildArticleBlob(current, "cat"))

    // Assert
    expect(result.page.image).toEqual(image)
  })

  it("omits the image key entirely when the source page has none", () => {
    // Arrange
    const current = makeContentBlob({ summary: "x" })

    // Act
    const result = asResult(buildArticleBlob(current, "cat"))

    // Assert
    expect("image" in result.page).toBe(false)
  })

  it("preserves all body content blocks (including disallowed-in-article blocks)", () => {
    // Arrange
    const current = makeContentBlob({ summary: "x" }, [
      proseBlock,
      infobarBlock,
      infocardsBlock,
    ])

    // Act
    const result = asResult(buildArticleBlob(current, "cat"))

    // Assert
    expect(result.content).toEqual([proseBlock, infobarBlock, infocardsBlock])
  })

  it("preserves the version field from the source blob", () => {
    // Arrange
    const current = makeContentBlob()

    // Act
    const result = asResult(buildArticleBlob(current, "cat"))

    // Assert
    expect(result.version).toBe("0.1.0")
  })

  it("drops contentPageHeader from the page object", () => {
    // Arrange
    const current = makeContentBlob({ summary: "x" })

    // Act
    const result = asResult(buildArticleBlob(current, "cat"))

    // Assert
    expect("contentPageHeader" in result.page).toBe(false)
  })

  it("does not mutate the source blob", () => {
    // Arrange
    const current = makeContentBlob(
      { summary: "Original", image: { src: "/a.png", alt: "a" } },
      [proseBlock, infobarBlock],
    )
    const snapshot = structuredClone(current)

    // Act
    buildArticleBlob(current, "News")

    // Assert
    expect(current).toEqual(snapshot)
  })

  it("updates category on an already-article blob while preserving article fields", () => {
    // Arrange
    const current = makeArticleBlob({
      summary: "Existing summary",
      category: "Old Category",
      date: "15 May 2024",
    })

    // Act
    const result = asResult(buildArticleBlob(current, "Feature Articles"))

    // Assert
    expect(result.layout).toBe("article")
    expect(result.page).toMatchObject({
      category: "Feature Articles",
      date: "15 May 2024",
      articlePageHeader: { summary: "Existing summary" },
    })
    expect("contentPageHeader" in result.page).toBe(false)
  })
})
