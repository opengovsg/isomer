import type { CollectionPageSchemaType, IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getCollectionItems } from "../getCollectionItems"

const SITE_LOGO_URL = "/isomer-logo.svg"
const SITE_NAME = "Isomer Next"
const SITE_LOGO_FALLBACK = {
  src: SITE_LOGO_URL,
  alt: `${SITE_NAME} site logo`,
  isContainNeeded: true,
}

const createArticleChild = (
  overrides?: Partial<IsomerSitemap>,
): IsomerSitemap =>
  ({
    id: "article-1",
    title: "Article 1",
    summary: "Summary",
    lastModified: "2024-01-01",
    permalink: "/collection/article-1",
    layout: "article" as const,
    ...overrides,
  }) as IsomerSitemap

const createSiteWithChildren = (children: IsomerSitemap[]) =>
  generateSiteConfig({
    siteMap: {
      id: "root",
      title: SITE_NAME,
      summary: "",
      lastModified: "2024-01-01",
      permalink: "/",
      layout: "homepage",
      children: [
        {
          id: "collection",
          title: "Collection",
          summary: "",
          lastModified: "2024-01-01",
          permalink: "/collection",
          layout: "collection",
          children,
        },
      ],
    },
  })

describe("getCollectionItems", () => {
  describe("showThumbnail is undefined", () => {
    it("should not include image when showThumbnail is undefined, even if item has an image", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: undefined,
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
        site,
        permalink: "/collection",
        showThumbnail: undefined,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toBeUndefined()
      expect(result[0]!.isContainNeeded).toBe(false)
    })
  })

  describe("showThumbnail with fallback 'logo'", () => {
    it("should use the item image when item has an image with a non-empty src", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
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
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should fall back to site logo when item image has an empty src", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: { src: "", alt: "" } }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should fall back to site logo when item image has an empty src but non-empty alt", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: { src: "", alt: "Some alt text" } }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should ignore item firstImage when fallback is 'logo'", () => {
      const firstImage = { src: "/images/first.png", alt: "First image" }
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined, firstImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })
  })

  describe("showThumbnail with fallback 'first-image'", () => {
    it("should use the item image when item has an image with a non-empty src, ignoring firstImage", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const firstImage = { src: "/images/first.png", alt: "First image" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage, firstImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to firstImage when item has no image but has a firstImage", () => {
      const firstImage = { src: "/images/first.png", alt: "First image" }
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined, firstImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(firstImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to firstImage when item image has an empty src", () => {
      const firstImage = { src: "/images/first.png", alt: "First image" }
      const site = createSiteWithChildren([
        createArticleChild({ image: { src: "", alt: "" }, firstImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(firstImage)
      expect(result[0]!.isContainNeeded).toBe(false)
    })

    it("should fall back to site logo when item has no image and no firstImage", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined, firstImage: undefined }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })

    it("should fall back to site logo when firstImage has an empty src", () => {
      const site = createSiteWithChildren([
        createArticleChild({
          image: undefined,
          firstImage: { src: "", alt: "" },
        }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[0]!.isContainNeeded).toBe(true)
    })
  })

  describe("mixed items with showThumbnail", () => {
    it("should resolve images per-item with fallback 'logo'", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const site = createSiteWithChildren([
        createArticleChild({
          id: "article-1",
          permalink: "/collection/article-1",
          image: itemImage,
        }),
        createArticleChild({
          id: "article-2",
          permalink: "/collection/article-2",
          image: undefined,
        }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "logo" },
      })

      expect(result).toHaveLength(2)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isContainNeeded).toBe(false)
      expect(result[1]!.image).toEqual(SITE_LOGO_FALLBACK)
      expect(result[1]!.isContainNeeded).toBe(true)
    })

    it("should resolve images per-item with fallback 'first-image'", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const firstImage = { src: "/images/first.png", alt: "First image" }
      const site = createSiteWithChildren([
        createArticleChild({
          id: "article-1",
          permalink: "/collection/article-1",
          image: itemImage,
        }),
        createArticleChild({
          id: "article-2",
          permalink: "/collection/article-2",
          image: undefined,
          firstImage,
        }),
        createArticleChild({
          id: "article-3",
          permalink: "/collection/article-3",
          image: undefined,
          firstImage: undefined,
        }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: { fallback: "first-image" },
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
        label: "Topic",
        id: "topic-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
      {
        label: "Category",
        id: "cat-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [
          { label: "Guides", id: "cat-opt-1" },
          { label: "Articles", id: "cat-opt-2" },
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
        site,
        permalink: "/collection",
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toEqual([
        { id: "cat-1", category: "Category", selected: ["Guides"] },
      ])
    })

    it("keeps all selected options for a plaintext group, uncombined (joining is a render concern)", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1", "cat-opt-2"] }),
      ])

      // Act
      const result = getCollectionItems({
        site,
        permalink: "/collection",
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toEqual([
        { id: "cat-1", category: "Category", selected: ["Guides", "Articles"] },
      ])
    })

    it("returns undefined when the collection has no tagCategories", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        site,
        permalink: "/collection",
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toBeUndefined()
    })

    it("returns plaintextTags with Others when the item has no tagged options", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: undefined }),
      ])

      // Act
      const result = getCollectionItems({
        site,
        permalink: "/collection",
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.plaintextTags).toEqual([
        { id: "cat-1", category: "Category", selected: ["Others"] },
      ])
      expect(result[0]!.tags).toEqual([
        { id: "cat-1", category: "Category", selected: ["Others"] },
      ])
    })
  })

  describe('pillTags include only display: "pills" groups', () => {
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
      {
        label: "Category",
        id: "cat-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [
          { label: "Guides", id: "cat-opt-1" },
          { label: "Articles", id: "cat-opt-2" },
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
        site,
        permalink: "/collection",
        tagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.tags).toEqual([
        { id: "topic-1", category: "Topic", selected: ["Health"] },
        { id: "cat-1", category: "Category", selected: ["Guides"] },
      ])
      expect(result[0]!.pillTags).toEqual([
        { id: "topic-1", category: "Topic", selected: ["Health"] },
      ])
    })

    it("returns undefined for tags and pillTags when tagCategories is undefined", () => {
      // Arrange
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["topic-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        site,
        permalink: "/collection",
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
          label: "Topic",
          id: "topic-1",
          options: [{ label: "Health", id: "topic-opt-1" }],
        },
      ] satisfies CollectionPageSchemaType["page"]["tagCategories"]
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["topic-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        site,
        permalink: "/collection",
        tagCategories: legacyTagCategories,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.pillTags).toEqual([
        { id: "topic-1", category: "Topic", selected: ["Health"] },
      ])
      expect(result[0]!.plaintextTags).toEqual([])
    })

    it('returns an empty array for pillTags when the only group is display: "plaintext"', () => {
      // Arrange
      const singleTagCategory = [
        {
          label: "Category",
          id: "cat-1",
          display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
          options: [{ label: "Guides", id: "cat-opt-1" }],
        },
      ]
      const site = createSiteWithChildren([
        createArticleChild({ tagged: ["cat-opt-1"] }),
      ])

      // Act
      const result = getCollectionItems({
        site,
        permalink: "/collection",
        tagCategories: singleTagCategory,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]!.tags).toEqual([
        { id: "cat-1", category: "Category", selected: ["Guides"] },
      ])
      expect(result[0]!.pillTags).toEqual([])
    })
  })
})
