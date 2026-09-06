import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getCollectionPages } from "../getCollectionPages"

describe("getCollectionPages", () => {
  let site: IsomerSiteProps = {
    // IsomerGeneratedSiteProps
    siteMap: {
      children: [],
      id: "root",
      lastModified: "2021-01-01",
      layout: "homepage",
      permalink: "/",
      summary: "Homepage summary",
      title: "Homepage",
    },
    siteMapArray: [
      {
        children: [],
        id: "root",
        lastModified: "2021-01-01",
        layout: "homepage",
        permalink: "/",
        summary: "Homepage summary",
        title: "Homepage",
      },
    ],
    lastUpdated: "2021-01-01",
    // IsomerSiteWideComponentsProps
    navbar: { items: [] }, // Provide minimal valid value
    footerItems: {
      contactUsLink: "/contact-us",
      privacyStatementLink: "/privacy",
      siteNavItems: [],
      termsOfUseLink: "/terms",
    },
    // IsomerSiteConfigProps
    siteName: "Test Site",
    theme: "isomer-next",
    url: "https://www.isomer.gov.sg",
    logoUrl: "/images/logo.svg",
    search: { searchUrl: "/search", type: "localSearch" },
  }
  const collectionId = "111"
  const collectionPermalink = `/this-is-a-test-collection`

  const createMockCollectionItem = ({
    id,
    permalink,
    date = "2021-01-01",
    image,
    firstImage,
    category,
    tagged,
  }: {
    id: string
    permalink: string
    date?: string
    image?: { src: string; alt: string }
    firstImage?: { src: string; alt: string }
    category?: string
    tagged?: string[]
  }): IsomerSitemap => ({
    category,
    date,
    firstImage,
    id,
    image,
    lastModified: date,
    layout: "article",
    permalink,
    summary: "Placeholder summary",
    tagged,
    title: `${id} title`,
  })

  it("should return an empty array when the collection exists but has no items", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      children: [],
      id: collectionId,
      lastModified: new Date("2021-01-01").toISOString(),
      layout: "collection",
      permalink: collectionPermalink,
      summary: "Collection 1 summary",
      title: "Collection 1",
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act + Assert
    const actual = getCollectionPages({ collectionParent, site })
    expect(actual).toStrictEqual([])
  })

  it("should return 3 items", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      children: [
        createMockCollectionItem({
          id: `${collectionId}1`,
          permalink: `${collectionPermalink}/1`,
        }),
        createMockCollectionItem({
          id: `${collectionId}2`,
          permalink: `${collectionPermalink}/2`,
        }),
        createMockCollectionItem({
          id: `${collectionId}3`,
          permalink: `${collectionPermalink}/3`,
        }),
        createMockCollectionItem({
          id: `${collectionId}4`,
          permalink: `${collectionPermalink}/4`,
        }),
      ],
      id: collectionId,
      lastModified: new Date("2021-01-01").toISOString(),
      layout: "collection",
      permalink: collectionPermalink,
      summary: "Collection 1 summary",
      title: "Collection 1",
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act
    const result = getCollectionPages({ collectionParent, site })

    // Assert
    expect(result).toHaveLength(3)
    expect(result.map((item) => item.referenceLinkHref)).toEqual([
      `${collectionPermalink}/1`,
      `${collectionPermalink}/2`,
      `${collectionPermalink}/3`,
    ])
  })

  it("should use specific defaultSortBy/defaultSortDirection from collectionPagePageProps if present", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      children: [
        createMockCollectionItem({
          id: `${collectionId}1`,
          permalink: `${collectionPermalink}/1`,
        }),
        createMockCollectionItem({
          id: `${collectionId}2`,
          permalink: `${collectionPermalink}/2`,
        }),
      ],
      collectionPagePageProps: {
        defaultSortBy: "title",
        defaultSortDirection: "desc",
      },
      id: collectionId,
      lastModified: new Date("2021-01-01").toISOString(),
      layout: "collection",
      permalink: collectionPermalink,
      summary: "Collection 1 summary",
      title: "Collection 1",
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act
    const result = getCollectionPages({ collectionParent, site })

    // Assert
    expect(result[0]?.itemTitle).toEqual(`${collectionId}2 title`)
    expect(result[1]?.itemTitle).toEqual(`${collectionId}1 title`)
  })

  describe("thumbnail resolution", () => {
    const itemWithImage = createMockCollectionItem({
      id: `${collectionId}1`,
      image: { alt: "Item image", src: "/item-image.jpg" },
      permalink: `${collectionPermalink}/1`,
    })
    const itemWithoutImageButWithFirstImage = createMockCollectionItem({
      firstImage: { alt: "First image", src: "/first-image.jpg" },
      id: `${collectionId}2`,
      permalink: `${collectionPermalink}/2`,
    })
    const itemWithNoImages = createMockCollectionItem({
      id: `${collectionId}3`,
      permalink: `${collectionPermalink}/3`,
    })

    const buildSite = () => ({
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    })

    let collectionParent: IsomerSitemap

    it("should use the item's own image when present, regardless of showThumbnail setting", () => {
      // Arrange
      collectionParent = {
        children: [itemWithImage],
        collectionPagePageProps: {
          showThumbnail: { fallback: "first-image" },
        },
        id: collectionId,
        lastModified: new Date("2021-01-01").toISOString(),
        layout: "collection",
        permalink: collectionPermalink,
        summary: "summary",
        title: "Collection 1",
      }

      // Act
      const result = getCollectionPages({ collectionParent, site: buildSite() })

      // Assert
      expect(result[0]?.image).toEqual({
        alt: "Item image",
        src: "/item-image.jpg",
      })
      expect(result[0]?.isContainNeeded).toBeFalsy()
    })

    it("should fall back to the site logo when showThumbnail is undefined on the referenced Collection", () => {
      // Arrange
      collectionParent = {
        children: [itemWithoutImageButWithFirstImage, itemWithNoImages],
        id: collectionId,
        lastModified: new Date("2021-01-01").toISOString(),
        layout: "collection",
        permalink: collectionPermalink,
        summary: "summary",
        title: "Collection 1",
      }

      // Act
      const result = getCollectionPages({ collectionParent, site: buildSite() })

      // Assert
      // Both items should resolve to the site logo since showThumbnail is undefined
      for (const item of result) {
        expect(item.image).toEqual({
          alt: `${site.siteName} site logo`,
          isContainNeeded: true,
          src: site.logoUrl,
        })
        expect(item.isContainNeeded).toBe(true)
      }
    })

    it("should fall back to the site logo when showThumbnail.fallback is 'logo'", () => {
      // Arrange
      collectionParent = {
        children: [itemWithoutImageButWithFirstImage],
        collectionPagePageProps: {
          showThumbnail: { fallback: "logo" },
        },
        id: collectionId,
        lastModified: new Date("2021-01-01").toISOString(),
        layout: "collection",
        permalink: collectionPermalink,
        summary: "summary",
        title: "Collection 1",
      }

      // Act
      const result = getCollectionPages({ collectionParent, site: buildSite() })

      // Assert
      expect(result[0]?.image).toEqual({
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
        src: site.logoUrl,
      })
    })

    it("should fall back to the first image on the page when showThumbnail.fallback is 'first-image'", () => {
      // Arrange
      collectionParent = {
        children: [itemWithoutImageButWithFirstImage, itemWithNoImages],
        collectionPagePageProps: {
          showThumbnail: { fallback: "first-image" },
        },
        id: collectionId,
        lastModified: new Date("2021-01-01").toISOString(),
        layout: "collection",
        permalink: collectionPermalink,
        summary: "summary",
        title: "Collection 1",
      }

      // Act
      const result = getCollectionPages({ collectionParent, site: buildSite() })

      // Assert
      const first = result.find(
        (r) => r.id === itemWithoutImageButWithFirstImage.permalink,
      )
      const second = result.find((r) => r.id === itemWithNoImages.permalink)
      expect(first?.image).toEqual({
        alt: "First image",
        src: "/first-image.jpg",
      })
      // When 'first-image' is set but no firstImage exists, should still
      // fall back to the site logo
      expect(second?.image).toEqual({
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
        src: site.logoUrl,
      })
    })
  })

  it("should use default sort values (date desc) when collectionPagePageProps sort values are absent", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      children: [
        createMockCollectionItem({
          date: "2021-01-01",
          id: `${collectionId}1`,
          permalink: `${collectionPermalink}/1`,
        }),
        createMockCollectionItem({
          date: "2021-01-02",
          id: `${collectionId}2`,
          permalink: `${collectionPermalink}/2`,
        }),
      ],
      id: collectionId,
      lastModified: new Date("2021-01-01").toISOString(),
      layout: "collection",
      permalink: collectionPermalink,
      summary: "Collection 1 summary",
      title: "Collection 1",
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act
    const result = getCollectionPages({ collectionParent, site })

    // Assert
    expect(result[0]?.itemTitle).toEqual(`${collectionId}2 title`)
    expect(result[1]?.itemTitle).toEqual(`${collectionId}1 title`)
  })

  describe("plaintextTags resolution", () => {
    it("threads the referenced Collection's tagCategories through to derive each card's plaintextTags from its tagged options", () => {
      // Arrange
      const collectionParent: IsomerSitemap = {
        children: [
          createMockCollectionItem({
            id: `${collectionId}1`,
            permalink: `${collectionPermalink}/1`,
            tagged: ["cat-opt-1"],
          }),
        ],
        collectionPagePageProps: {
          tagCategories: [
            {
              display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
              id: "cat-1",
              label: "Category",
              options: [{ id: "cat-opt-1", label: "Guides" }],
            },
          ],
        },
        id: collectionId,
        lastModified: new Date("2021-01-01").toISOString(),
        layout: "collection",
        permalink: collectionPermalink,
        summary: "Collection 1 summary",
        title: "Collection 1",
      }
      site = {
        ...site,
        siteMap: {
          ...site.siteMap,
          children: [collectionParent],
        },
      }

      // Act
      const result = getCollectionPages({ collectionParent, site })

      // Assert
      expect(result[0]?.plaintextTags).toEqual([
        { category: "Category", id: "cat-1", selected: ["Guides"] },
      ])
    })

    it("resolves plaintextTags to undefined when the referenced Collection has no tagCategories", () => {
      // Arrange
      const collectionParent: IsomerSitemap = {
        children: [
          createMockCollectionItem({
            id: `${collectionId}1`,
            permalink: `${collectionPermalink}/1`,
            tagged: ["cat-opt-1"],
          }),
        ],
        id: collectionId,
        lastModified: new Date("2021-01-01").toISOString(),
        layout: "collection",
        permalink: collectionPermalink,
        summary: "Collection 1 summary",
        title: "Collection 1",
      }
      site = {
        ...site,
        siteMap: {
          ...site.siteMap,
          children: [collectionParent],
        },
      }

      // Act
      const result = getCollectionPages({ collectionParent, site })

      // Assert
      expect(result[0]?.plaintextTags).toBeUndefined()
    })
  })
})
