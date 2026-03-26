import { describe, expect, it } from "vitest"

import type { IsomerSitemap } from "~/types"
import { generateSiteConfig } from "~/stories/helpers/generateSiteConfig"
import { getCollectionItems } from "../getCollectionItems"

const SITE_LOGO_URL = "/isomer-logo.svg"
const SITE_NAME = "Isomer Next"

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
  describe("image fallback to site logo", () => {
    it("should use the item image when item has an image with a non-empty src", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: true,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isFallbackImage).toBe(false)
    })

    it("should fall back to site logo when item has no image", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: true,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual({
        src: SITE_LOGO_URL,
        alt: `${SITE_NAME} site logo`,
      })
      expect(result[0]!.isFallbackImage).toBe(true)
    })

    it("should fall back to site logo when item image has an empty src", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: { src: "", alt: "" } }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: true,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual({
        src: SITE_LOGO_URL,
        alt: `${SITE_NAME} site logo`,
      })
      expect(result[0]!.isFallbackImage).toBe(true)
    })

    it("should fall back to site logo when item image has an empty src but non-empty alt", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: { src: "", alt: "Some alt text" } }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: true,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual({
        src: SITE_LOGO_URL,
        alt: `${SITE_NAME} site logo`,
      })
      expect(result[0]!.isFallbackImage).toBe(true)
    })

    it("should not include image when showThumbnail is false", () => {
      const site = createSiteWithChildren([
        createArticleChild({ image: undefined }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
        showThumbnail: false,
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toBeUndefined()
      expect(result[0]!.isFallbackImage).toBe(false)
    })
  })

  describe("showThumbnail not explicitly set (auto-detection)", () => {
    it("should show thumbnails when at least one item has an image", () => {
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
      })

      expect(result).toHaveLength(2)
      // Item with image uses its own image
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isFallbackImage).toBe(false)
      // Item without image falls back to site logo
      expect(result[1]!.image).toEqual({
        src: SITE_LOGO_URL,
        alt: `${SITE_NAME} site logo`,
      })
      expect(result[1]!.isFallbackImage).toBe(true)
    })

    it("should not show thumbnails when no items have images", () => {
      const site = createSiteWithChildren([
        createArticleChild({
          id: "article-1",
          permalink: "/collection/article-1",
          image: undefined,
        }),
        createArticleChild({
          id: "article-2",
          permalink: "/collection/article-2",
          image: { src: "", alt: "" },
        }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
      })

      expect(result).toHaveLength(2)
      expect(result[0]!.image).toBeUndefined()
      expect(result[1]!.image).toBeUndefined()
    })

    it("should use the item image when only one item exists and has an image", () => {
      const itemImage = { src: "/images/thumbnail.png", alt: "Thumbnail" }
      const site = createSiteWithChildren([
        createArticleChild({ image: itemImage }),
      ])

      const result = getCollectionItems({
        site,
        permalink: "/collection",
      })

      expect(result).toHaveLength(1)
      expect(result[0]!.image).toEqual(itemImage)
      expect(result[0]!.isFallbackImage).toBe(false)
    })
  })
})
