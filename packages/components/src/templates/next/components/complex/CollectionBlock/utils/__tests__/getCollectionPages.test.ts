import { describe, expect, it } from "vitest"

import type { IsomerSitemap, IsomerSiteProps } from "~/types"
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
    logoUrl: "/images/logo.svg",
    search: { type: "localSearch", searchUrl: "/search" },
  }
  const collectionId = "111"
  const collectionPermalink = `/this-is-a-test-collection`

  const createMockCollectionItem = ({
    id,
    permalink,
    date = "2021-01-01",
  }: {
    id: string
    permalink: string
    date?: string
  }): IsomerSitemap => ({
    id,
    title: `${id} title`,
    permalink,
    summary: "Placeholder summary",
    lastModified: date,
    layout: "article",
    date,
  })

  it("should throw an error when the collection exists but has no items", () => {
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
    expect(() => getCollectionPages({ site, collectionParent })).toThrow()
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
