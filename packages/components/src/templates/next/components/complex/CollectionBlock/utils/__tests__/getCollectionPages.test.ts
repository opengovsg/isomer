import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import { describe, expect, it } from "vitest"

import { getCollectionPages } from "../getCollectionPages"

describe("getCollectionPages", () => {
  let site: IsomerSiteProps = {
    // IsomerGeneratedSiteProps
    siteMap: {
      id: "root",
      title: "Homepage",
      permalink: "/",
      layout: "homepage",
      summary: "Homepage summary",
      lastModified: "2021-01-01",
      children: [],
    },
    siteMapArray: [
      {
        id: "root",
        title: "Homepage",
        permalink: "/",
        layout: "homepage",
        summary: "Homepage summary",
        lastModified: "2021-01-01",
        children: [],
      },
    ],
    lastUpdated: "2021-01-01",
    // IsomerSiteWideComponentsProps
    navbar: { items: [] }, // Provide minimal valid value
    footerItems: {
      contactUsLink: "/contact-us",
      privacyStatementLink: "/privacy",
      termsOfUseLink: "/terms",
      siteNavItems: [],
    },
    // IsomerSiteConfigProps
    siteName: "Test Site",
    theme: "isomer-next",
    url: "https://www.isomer.gov.sg",
    logoUrl: "/images/logo.svg",
    search: { type: "localSearch", searchUrl: "/search" },
  }
  const collectionId = "111"
  const collectionPermalink = `/this-is-a-test-collection`

  const createMockCollectionItem = ({
    id,
    permalink,
    date = "2021-01-01",
    image,
    firstImage,
  }: {
    id: string
    permalink: string
    date?: string
    image?: { src: string; alt: string }
    firstImage?: { src: string; alt: string }
  }): IsomerSitemap => ({
    id,
    title: `${id} title`,
    permalink,
    summary: "Placeholder summary",
    lastModified: date,
    layout: "article",
    date,
    image,
    firstImage,
  })

  it("should return an empty array when the collection exists but has no items", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      id: collectionId,
      title: "Collection 1",
      permalink: collectionPermalink,
      layout: "collection",
      summary: "Collection 1 summary",
      lastModified: new Date("2021-01-01").toISOString(),
      children: [],
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act + Assert
    const actual = getCollectionPages({ site, collectionParent })
    expect(actual).toStrictEqual([])
  })

  it("should return 3 items", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      id: collectionId,
      title: "Collection 1",
      permalink: collectionPermalink,
      layout: "collection",
      summary: "Collection 1 summary",
      lastModified: new Date("2021-01-01").toISOString(),
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
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act
    const result = getCollectionPages({ site, collectionParent })

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
      id: collectionId,
      title: "Collection 1",
      permalink: collectionPermalink,
      layout: "collection",
      summary: "Collection 1 summary",
      lastModified: new Date("2021-01-01").toISOString(),
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
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act
    const result = getCollectionPages({ site, collectionParent })

    // Assert
    expect(result[0]?.itemTitle).toEqual(`${collectionId}2 title`)
    expect(result[1]?.itemTitle).toEqual(`${collectionId}1 title`)
  })

  describe("thumbnail resolution", () => {
    const itemWithImage = createMockCollectionItem({
      id: `${collectionId}1`,
      permalink: `${collectionPermalink}/1`,
      image: { src: "/item-image.jpg", alt: "Item image" },
    })
    const itemWithoutImageButWithFirstImage = createMockCollectionItem({
      id: `${collectionId}2`,
      permalink: `${collectionPermalink}/2`,
      firstImage: { src: "/first-image.jpg", alt: "First image" },
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
      collectionParent = {
        id: collectionId,
        title: "Collection 1",
        permalink: collectionPermalink,
        layout: "collection",
        summary: "summary",
        lastModified: new Date("2021-01-01").toISOString(),
        children: [itemWithImage],
        collectionPagePageProps: {
          showThumbnail: { fallback: "first-image" },
        },
      }
      const result = getCollectionPages({ site: buildSite(), collectionParent })
      expect(result[0]?.image).toEqual({
        src: "/item-image.jpg",
        alt: "Item image",
      })
      expect(result[0]?.isContainNeeded).toBeFalsy()
    })

    it("should fall back to the site logo when showThumbnail is undefined on the referenced Collection", () => {
      collectionParent = {
        id: collectionId,
        title: "Collection 1",
        permalink: collectionPermalink,
        layout: "collection",
        summary: "summary",
        lastModified: new Date("2021-01-01").toISOString(),
        children: [itemWithoutImageButWithFirstImage, itemWithNoImages],
      }
      const result = getCollectionPages({ site: buildSite(), collectionParent })
      // Both items should resolve to the site logo since showThumbnail is undefined
      result.forEach((item) => {
        expect(item.image).toEqual({
          src: site.logoUrl,
          alt: `${site.siteName} site logo`,
          isContainNeeded: true,
        })
        expect(item.isContainNeeded).toBe(true)
      })
    })

    it("should fall back to the site logo when showThumbnail.fallback is 'logo'", () => {
      collectionParent = {
        id: collectionId,
        title: "Collection 1",
        permalink: collectionPermalink,
        layout: "collection",
        summary: "summary",
        lastModified: new Date("2021-01-01").toISOString(),
        children: [itemWithoutImageButWithFirstImage],
        collectionPagePageProps: {
          showThumbnail: { fallback: "logo" },
        },
      }
      const result = getCollectionPages({ site: buildSite(), collectionParent })
      expect(result[0]?.image).toEqual({
        src: site.logoUrl,
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
      })
    })

    it("should fall back to the first image on the page when showThumbnail.fallback is 'first-image'", () => {
      collectionParent = {
        id: collectionId,
        title: "Collection 1",
        permalink: collectionPermalink,
        layout: "collection",
        summary: "summary",
        lastModified: new Date("2021-01-01").toISOString(),
        children: [itemWithoutImageButWithFirstImage, itemWithNoImages],
        collectionPagePageProps: {
          showThumbnail: { fallback: "first-image" },
        },
      }
      const result = getCollectionPages({ site: buildSite(), collectionParent })
      const first = result.find(
        (r) => r.id === itemWithoutImageButWithFirstImage.permalink,
      )
      const second = result.find((r) => r.id === itemWithNoImages.permalink)
      expect(first?.image).toEqual({
        src: "/first-image.jpg",
        alt: "First image",
      })
      // When 'first-image' is set but no firstImage exists, should still
      // fall back to the site logo
      expect(second?.image).toEqual({
        src: site.logoUrl,
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
      })
    })
  })

  it("should use default sort values (date desc) when collectionPagePageProps sort values are absent", () => {
    // Arrange
    const collectionParent: IsomerSitemap = {
      id: collectionId,
      title: "Collection 1",
      permalink: collectionPermalink,
      layout: "collection",
      summary: "Collection 1 summary",
      lastModified: new Date("2021-01-01").toISOString(),
      children: [
        createMockCollectionItem({
          id: `${collectionId}1`,
          permalink: `${collectionPermalink}/1`,
          date: "2021-01-01",
        }),
        createMockCollectionItem({
          id: `${collectionId}2`,
          permalink: `${collectionPermalink}/2`,
          date: "2021-01-02",
        }),
      ],
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionParent],
      },
    }

    // Act
    const result = getCollectionPages({ site, collectionParent })

    // Assert
    expect(result[0]?.itemTitle).toEqual(`${collectionId}2 title`)
    expect(result[1]?.itemTitle).toEqual(`${collectionId}1 title`)
  })
})
