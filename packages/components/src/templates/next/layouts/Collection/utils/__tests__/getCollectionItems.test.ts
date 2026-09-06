import type { CollectionPageSchemaType, IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getCollectionItems } from "../getCollectionItems"

const SITE_LOGO_URL = "/isomer-logo.svg"
const SITE_NAME = "Isomer Next"
const SITE_LOGO_FALLBACK = {
  alt: `${SITE_NAME} site logo`,
  isContainNeeded: true,
  src: SITE_LOGO_URL,
}

const createArticleChild = (
  overrides?: Partial<IsomerSitemap>,
): IsomerSitemap => {
  const child = {
    id: "article-1",
    lastModified: "2024-01-01",
    layout: "article" as const,
    permalink: "/collection/article-1",
    summary: "Summary",
    title: "Article 1",
    ...overrides,
  }
  // SAFETY: test fixture builds a minimal article sitemap node
  return child as IsomerSitemap
}

const createSiteWithChildren = (children: IsomerSitemap[]) =>
  generateSiteConfig({
    siteMap: {
      children: [
        {
          children,
          id: "collection",
          lastModified: "2024-01-01",
          layout: "collection",
          permalink: "/collection",
          summary: "",
          title: "Collection",
        },
      ],
      id: "root",
      lastModified: "2024-01-01",
      layout: "homepage",
      permalink: "/",
      summary: "",
      title: SITE_NAME,
    },
  })

describe("getCollectionItems", () => {
  describe("showThumbnail is undefined", () => {
    it("should not include image when showThumbnail is undefined, even if item has an image", () => {
      const itemImage = { alt: "Thumbnail", src: "/images/thumbnail.png" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: undefined,
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toBeUndefined()
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should not include image when showThumbnail is undefined and item has no image", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: undefined,
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toBeUndefined()
      expect(result[0]!.isContainNeeded).toBe(false)
    })
  })

  describe("showThumbnail with fallback 'logo'", () => {
    it("should use the item image when item has an image with a non-empty src", () => {
      const itemImage = { alt: "Thumbnail", src: "/images/thumbnail.png" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to site logo when item has no image", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should fall back to site logo when item image has an empty src", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: { alt: "", src: "" } }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should fall back to site logo when item image has an empty src but non-empty alt", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: { alt: "Some alt text", src: "" } }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should ignore item firstImage when fallback is 'logo'", () => {
      const firstImage = { alt: "First image", src: "/images/first.png" }
      const site = createSiteWithChildren([
        createArticleChild({ firstImage, image: undefined }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })
  })

  describe("showThumbnail with fallback 'first-image'", () => {
    it("should use the item image when item has an image with a non-empty src, ignoring firstImage", () => {
      const itemImage = { alt: "Thumbnail", src: "/images/thumbnail.png" }
      const firstImage = { alt: "First image", src: "/images/first.png" }
      const site = createSiteWithChildren([
        createArticleChild({ firstImage, image: itemImage }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to firstImage when item has no image but has a firstImage", () => {
      const firstImage = { alt: "First image", src: "/images/first.png" }
      const site = createSiteWithChildren([
        createArticleChild({ firstImage, image: undefined }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(firstImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to firstImage when item image has an empty src", () => {
      const firstImage = { alt: "First image", src: "/images/first.png" }
      const site = createSiteWithChildren([
        createArticleChild({ firstImage, image: { alt: "", src: "" } }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(firstImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to site logo when item has no image and no firstImage", () => {
      const site = createSiteWithChildren([
        createArticleChild({ firstImage: undefined, image: undefined }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should fall back to site logo when firstImage has an empty src", () => {
      const site = createSiteWithChildren([
        createArticleChild({
          firstImage: { alt: "", src: "" },
          image: undefined,
        }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
        site,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })
  })

  describe("mixed items with showThumbnail", () => {
    it("should resolve images per-item with fallback 'logo'", () => {
      const itemImage = { alt: "Thumbnail", src: "/images/thumbnail.png" }
      const site = createSiteWithChildren([
        createArticleChild({
          id: "article-1",
          image: itemImage,
          permalink: "/collection/article-1",
        }),
        createArticleChild({
          id: "article-2",
          image: undefined,
          permalink: "/collection/article-2",
        }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
        site,
      })

      expect(result).toHaveLength(2)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isContainNeeded).toBe(false)
      expect(result[1]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[1]!.isContainNeeded).toBe(true)
    })

    it("should resolve images per-item with fallback 'first-image'", () => {
      const itemImage = { alt: "Thumbnail", src: "/images/thumbnail.png" }
      const firstImage = { alt: "First image", src: "/images/first.png" }
      const site = createSiteWithChildren([
        createArticleChild({
          id: "article-1",
          image: itemImage,
          permalink: "/collection/article-1",
        }),
        createArticleChild({
          firstImage,
          id: "article-2",
          image: undefined,
          permalink: "/collection/article-2",
        }),
        createArticleChild({
          firstImage: undefined,
          id: "article-3",
          image: undefined,
          permalink: "/collection/article-3",
        }),
      ])

      const result = getCollectionItems({
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
        site,
      })

      expect(result).toHaveLength(3)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isContainNeeded).toBe(false)
      expect(result[1]!.image).toEqual(firstImage)
      expect(result[1]!.isContainNeeded).toBe(false)
      expect(result[2]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[2]!.isContainNeeded).toBe(true)
    })
  })

  describe("plaintextTags resolution", () => {
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "topic-1",
        label: "Topic",
        options: [{ id: "topic-opt-1", label: "Health" }],
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        id: "cat-1",
        label: "Category",
        options: [
          { id: "cat-opt-1", label: "Guides" },
          { id: "cat-opt-2", label: "Articles" },
        ],
      },
    ]

    it('resolves plaintextTags from groups with display: "plaintext" via the item\'s tagged options', () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toEqual([
        { category: "Category", id: "cat-1", selected: ["Guides"] },
      ])
    })

    it("keeps all selected options for a plaintext group, uncombined (joining is a render concern)", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1", "cat-opt-2"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toEqual([
        { category: "Category", id: "cat-1", selected: ["Guides", "Articles"] },
      ])
    })

    it("returns undefined when the collection has no tagCategories", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toBeUndefined()
    })

    it("returns undefined when the item has no tagged options", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: undefined }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toBeUndefined()
    })
  })

  describe('pillTags include only display: "pills" groups', () => {
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "topic-1",
        label: "Topic",
        options: [{ id: "topic-opt-1", label: "Health" }],
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        id: "cat-1",
        label: "Category",
        options: [
          { id: "cat-opt-1", label: "Guides" },
          { id: "cat-opt-2", label: "Articles" },
        ],
      },
    ]

    it("includes all groups in tags, but only pills groups in pillTags", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["topic-opt-1", "cat-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.tags).toEqual([
        { category: "Topic", id: "topic-1", selected: ["Health"] },
        { category: "Category", id: "cat-1", selected: ["Guides"] },
      ])
      expect(result[0]!.pillTags).toEqual([
        { category: "Topic", id: "topic-1", selected: ["Health"] },
      ])
    })

    it("returns undefined for tags and pillTags when tagCategories is undefined", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["topic-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.tags).toBeUndefined()
      expect(result[0]!.pillTags).toBeUndefined()
    })

    it("treats legacy tag categories without display as pills in pillTags", () => {
      // Arrange
      const legacyTagCategories = [
        {
          id: "topic-1",
          label: "Topic",
          options: [{ id: "topic-opt-1", label: "Health" }],
        },
      ] satisfies CollectionPageSchemaType["page"]["tagCategories"]
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["topic-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
        tagCategories: legacyTagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.pillTags).toEqual([
        { category: "Topic", id: "topic-1", selected: ["Health"] },
      ])
      expect(result[0]!.plaintextTags).toEqual([])
    })

    it('returns an empty array for pillTags when the only group is display: "plaintext"', () => {
      // Arrange
      const singleTagCategory = [
        {
          display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
          id: "cat-1",
          label: "Category",
          options: [{ id: "cat-opt-1", label: "Guides" }],
        },
      ]
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        permalink: "/collection",
        site,
        tagCategories: singleTagCategory,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.tags).toEqual([
        { category: "Category", id: "cat-1", selected: ["Guides"] },
      ])
      expect(result[0]!.pillTags).toEqual([])
    })
  })
})
