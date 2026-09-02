import type { IsomerSitemap } from "@opengovsg/isomer-components"
import type { CollectionLinkProps } from "~/schemas/collection"
import { describe, expect, it } from "vitest"

import { buildCollectionLinkPreviewSitemap } from "../buildCollectionLinkPreviewSitemap"

const LINK: CollectionLinkProps = {
  ref: "[resource:1:2]",
  category: "",
  description: "A summary",
}

const buildSitemap = (
  overrides: Partial<
    Parameters<typeof buildCollectionLinkPreviewSitemap>[0]
  > = {},
) =>
  buildCollectionLinkPreviewSitemap({
    permalink: "/circulars/my-link",
    title: "My link",
    link: LINK,
    collectionTitle: "Circulars",
    ancestorTitles: [],
    tagCategories: undefined,
    showThumbnail: undefined,
    lastModified: "2024-01-01",
    ...overrides,
  })

// The Collection layout walks the sitemap one permalink segment at a time from
// the root, so a node must exist at every prefix of the collection's permalink.
const collectNodePermalinks = (node: IsomerSitemap): string[] => [
  node.permalink,
  ...(node.children?.flatMap(collectNodePermalinks) ?? []),
]

describe("buildCollectionLinkPreviewSitemap", () => {
  describe("collection at the top level", () => {
    it("nests the link directly under the collection", () => {
      // Arrange / Act
      const result = buildSitemap()

      // Assert
      expect(collectNodePermalinks(result)).toEqual([
        "/",
        "/circulars",
        "/circulars/my-link",
      ])
    })
  })

  describe("collection nested inside folders", () => {
    it("creates a node for every permalink prefix so the walk can reach the link", () => {
      // Arrange / Act
      const result = buildSitemap({
        permalink: "/a/b/circulars/my-link",
        ancestorTitles: ["A", "B"],
      })

      // Assert
      expect(collectNodePermalinks(result)).toEqual([
        "/",
        "/a",
        "/a/b",
        "/a/b/circulars",
        "/a/b/circulars/my-link",
      ])
    })

    it("titles the intermediate nodes with the real resource titles", () => {
      // Arrange / Act
      const result = buildSitemap({
        permalink: "/resources/circulars/my-link",
        ancestorTitles: ["Resources"],
      })

      // Assert
      expect(result.children?.[0]?.title).toBe("Resources")
      expect(result.children?.[0]?.children?.[0]?.title).toBe("Circulars")
    })

    it("falls back to the permalink segment when a title is unavailable", () => {
      // Arrange / Act
      const result = buildSitemap({
        permalink: "/resources/circulars/my-link",
        ancestorTitles: [],
      })

      // Assert
      expect(result.children?.[0]?.title).toBe("resources")
    })
  })

  describe("the link node", () => {
    it("keeps the link layout so the collection picks it up as an item", () => {
      // Arrange / Act
      const result = buildSitemap()
      const linkNode = result.children?.[0]?.children?.[0]

      // Assert
      expect(linkNode).toMatchObject({
        layout: "link",
        title: "My link",
        summary: "A summary",
        permalink: "/circulars/my-link",
        ref: "[resource:1:2]",
      })
    })

    it("carries the link's thumbnail so the collection can render it", () => {
      // Arrange
      const image = { src: "https://example.com/thumb.png", alt: "Thumbnail" }

      // Act
      const result = buildSitemap({ link: { ...LINK, image } })
      const linkNode = result.children?.[0]?.children?.[0]

      // Assert
      expect(linkNode).toMatchObject({ image })
    })
  })

  describe("the collection node", () => {
    it("passes the collection's showThumbnail setting through", () => {
      // Arrange
      const showThumbnail = { fallback: "logo" as const }

      // Act
      const result = buildSitemap({ showThumbnail })
      const collectionNode = result.children?.[0]

      // Assert
      expect(collectionNode).toMatchObject({
        layout: "collection",
        collectionPagePageProps: { showThumbnail },
      })
    })
  })
})
