import type {
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import { ARTICLE_TYPES, asContentBlob, asIndexBlob, asPageBlob, buildArticleBlob, buildCollectionIndexBlob, buildConversionReport, CONTENT_ONLY_TYPES, CONTENT_TYPES, findDisallowedBlocks, toFolderPlan } from './helpers';
import type { ArticleBlob, ContentBlob, ConversionPlan, IndexBlob } from './helpers';

// Shape used purely for asserting on builder output without TypeScript
// narrowing on the `IsomerSchema` union for every property access.
interface BuilderPageResult {
  title?: string
  subtitle?: string
  sortOrder?: string
  category?: string
  date?: string
  image?: { src: string; alt: string }
  articlePageHeader?: { summary: string }
  contentPageHeader?: { summary: string; showThumbnail?: boolean }
}

interface BuilderResult {
  version: string
  layout: string
  page: BuilderPageResult
  content: unknown[]
}

const asResult = (s: IsomerSchema): BuilderResult => s

const toIsomerSchema = (
  blob: IndexBlob | ContentBlob | ArticleBlob,
): IsomerSchema => 
  // SAFETY: test fixtures are valid page blobs without the render-time site field.
  // @ts-expect-error test blobs omit render-time site props required by IsomerSchema.
  blob as IsomerSchema


const proseBlock: IsomerComponent = {
  content: [{ type: "paragraph", content: [{ type: "text", text: "hi" }] }],
  type: "prose",
}

const infobarBlock: IsomerComponent = {
  description: "Call-to-action",
  title: "CTA",
  type: "infobar",
}

const infocardsBlock: IsomerComponent = {
  cards: [
    {
      title: "Card",
      url: "https://example.com",
      imageUrl: "/img.png",
      imageAlt: "alt",
      imageFit: "cover",
    },
  ],
  maxColumns: "3",
  title: "Cards",
  type: "infocards",
  variant: "cardsWithImages",
}

interface PageOverrides {
  summary?: string
  image?: { src: string; alt: string }
}

const makeIndexBlob = (overrides?: PageOverrides): IndexBlob => {
  const page = {
    contentPageHeader: {
      showThumbnail: false,
      summary: overrides?.summary ?? "Index summary",
    },
    title: "Index",
  }
  if (overrides?.image) {
    Object.assign(page, { image: overrides.image })
  }
  const blob = {
    content: [],
    layout: "index",
    page,
    version: "0.1.0",
  }
  // SAFETY: test fixture matches IndexBlob layout discriminator.
  // @ts-expect-error test fixture uses string layout literal without full IndexBlob typing.
  return blob as IndexBlob
}

const makeContentBlob = (
  overrides?: PageOverrides,
  content: IsomerComponent[] = [],
): ContentBlob => {
  const page = {
    contentPageHeader: {
      showThumbnail: false,
      summary: overrides?.summary ?? "Content summary",
    },
    title: "Page",
  }
  if (overrides?.image) {
    Object.assign(page, { image: overrides.image })
  }
  const blob = {
    content,
    layout: "content",
    page,
    version: "0.1.0",
  }
  // SAFETY: test fixture matches ContentBlob layout discriminator.
  // @ts-expect-error test fixture uses string layout literal without full ContentBlob typing.
  return blob as ContentBlob
}

const makeArticleBlob = (
  overrides?: PageOverrides & { category?: string; date?: string },
  content: IsomerComponent[] = [],
): ArticleBlob => {
  const page = {
    articlePageHeader: {
      summary: overrides?.summary ?? "Article summary",
    },
    category: overrides?.category ?? "News",
    date: overrides?.date ?? "1 Jan 2024",
    title: "Article",
  }
  if (overrides?.image) {
    Object.assign(page, { image: overrides.image })
  }
  const blob = {
    content,
    layout: "article",
    page,
    version: "0.1.0",
  }
  // SAFETY: test fixture matches ArticleBlob layout discriminator.
  // @ts-expect-error test fixture uses string layout literal without full ArticleBlob typing.
  return blob as ArticleBlob
}

const withIndexContent = (
  blob: IndexBlob,
  content: IsomerComponent[],
): IndexBlob => ({
  ...blob,
  content,
})

const withIndexPageSortOrder = (
  blob: IndexBlob,
  sortOrder: string,
): IndexBlob => {
  const updated = {
    ...blob,
    page: {
      ...blob.page,
      sortOrder,
    },
  }
  // SAFETY: test fixture preserves IndexBlob layout while updating sortOrder.
  return updated
}
const makeConversionPlan = (
  overrides?: Partial<ConversionPlan>,
): ConversionPlan => ({
  defaultCategory: "Feature Articles",
  folder: {
    id: "159351",
    permalink: "folder",
    siteId: 1,
    title: "Folder",
  },
  indexPage: {
    currentBlob: toIsomerSchema(makeIndexBlob()),
    currentBlobId: "blob-index",
    disallowedBlocks: [],
    nextBlob: toIsomerSchema(makeIndexBlob()),
    permalink: "_index",
    resourceId: "159352",
    title: "Index",
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
          currentBlob: toIsomerSchema(makeContentBlob()),
          currentBlobId: "b1",
          disallowedBlocks: [],
          nextBlob: toIsomerSchema(makeArticleBlob()),
          permalink: "clean",
          resourceId: "1",
          title: "Clean page",
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
          currentBlob: toIsomerSchema(makeContentBlob({}, [infobarBlock])),
          currentBlobId: "b1",
          disallowedBlocks: [{ index: 0, type: "infobar" }],
          nextBlob: toIsomerSchema(makeArticleBlob({}, [infobarBlock])),
          permalink: "flagged",
          resourceId: "159536",
          title: "Flagged",
        },
        {
          currentBlob: toIsomerSchema(makeContentBlob()),
          currentBlobId: "b2",
          disallowedBlocks: [],
          nextBlob: toIsomerSchema(makeArticleBlob()),
          permalink: "clean",
          resourceId: "159537",
          title: "Clean",
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
          currentBlob: toIsomerSchema(
            makeContentBlob({}, [infobarBlock, infocardsBlock]),
          ),
          currentBlobId: "b1",
          disallowedBlocks: [
            { index: 0, type: "infobar" },
            { index: 1, type: "infocards" },
          ],
          nextBlob: toIsomerSchema(
            makeArticleBlob({}, [infobarBlock, infocardsBlock]),
          ),
          permalink: "many",
          resourceId: "99",
          title: "Many flags",
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
          currentBlob: toIsomerSchema(makeContentBlob()),
          currentBlobId: "b1",
          disallowedBlocks: [],
          nextBlob: toIsomerSchema(makeArticleBlob()),
          permalink: "a",
          resourceId: "159536",
          title: "Page A",
        },
        {
          currentBlob: toIsomerSchema(makeContentBlob()),
          currentBlobId: "b2",
          disallowedBlocks: [],
          nextBlob: toIsomerSchema(makeArticleBlob()),
          permalink: "b",
          resourceId: "159537",
          title: "Page B",
        },
      ],
    })

    // Act
    const folderPlan = toFolderPlan(plan)

    // Assert
    expect(folderPlan).toEqual({
      defaultCategory: "Feature Articles",
      id: "159351",
      indexPageId: "159352",
      pageIds: ["159536", "159537"],
      permalink: "folder",
      siteId: 1,
      title: "Folder",
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
    const blob = toIsomerSchema(makeIndexBlob())

    // Act
    const result = asIndexBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("throws when layout is not 'index'", () => {
    // Arrange
    const blob = toIsomerSchema(makeContentBlob())

    // Act + Assert
    expect(() => asIndexBlob(blob)).toThrow(
      `Expected layout="index", got "content"`,
    )
  })
})

describe("asPageBlob", () => {
  it("returns content blobs unchanged", () => {
    // Arrange
    const blob = toIsomerSchema(makeContentBlob())

    // Act
    const result = asPageBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("returns article blobs unchanged", () => {
    // Arrange
    const blob = toIsomerSchema(makeArticleBlob())

    // Act
    const result = asPageBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("throws when layout is neither content nor article", () => {
    // Arrange
    const blob = toIsomerSchema(makeIndexBlob())

    // Act + Assert
    expect(() => asPageBlob(blob)).toThrow(
      `Expected layout="content" or "article", got "index"`,
    )
  })
})

describe("asContentBlob", () => {
  it("returns the blob unchanged when layout is 'content'", () => {
    // Arrange
    const blob = toIsomerSchema(makeContentBlob())

    // Act
    const result = asContentBlob(blob)

    // Assert
    expect(result).toBe(blob)
  })

  it("throws when layout is not 'content'", () => {
    // Arrange
    const blob = toIsomerSchema(makeIndexBlob())

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
      sortOrder: "date-desc",
      subtitle: "Summary text",
      title: "Folder Title",
    })
  })

  it("preserves the image when present on the source page", () => {
    // Arrange
    const image = { alt: "alt", src: "/img.png" }
    const current = makeIndexBlob({ image, summary: "x" })

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
    const current = withIndexContent(makeIndexBlob({ summary: "x" }), [
      proseBlock,
      infobarBlock,
    ])

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
    const current = withIndexPageSortOrder(
      makeIndexBlob({ summary: "x" }),
      "date-asc",
    )

    // Act
    const result = asResult(buildCollectionIndexBlob(current, "Folder"))

    // Assert
    expect(result.page.sortOrder).toBe("date-desc")
  })

  it("does not mutate the source blob", () => {
    // Arrange
    const current = makeIndexBlob({
      image: { alt: "a", src: "/a.png" },
      summary: "Original",
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
    const image = { alt: "alt", src: "/img.png" }
    const current = makeContentBlob({ image, summary: "x" })

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
      { image: { alt: "a", src: "/a.png" }, summary: "Original" },
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
      category: "Old Category",
      date: "15 May 2024",
      summary: "Existing summary",
    })

    // Act
    const result = asResult(buildArticleBlob(current, "Feature Articles"))

    // Assert
    expect(result.layout).toBe("article")
    expect(result.page).toMatchObject({
      articlePageHeader: { summary: "Existing summary" },
      category: "Feature Articles",
      date: "15 May 2024",
    })
    expect("contentPageHeader" in result.page).toBe(false)
  })
})
