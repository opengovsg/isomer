import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import { describe, expect, it } from "vitest"

import { getCollectionParent } from "../getCollectionParent"

describe("getCollectionParent", () => {
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

  const collectionNode: IsomerSitemap = {
    id: collectionId,
    lastModified: new Date("2021-01-01").toISOString(),
    layout: "collection",
    permalink: collectionPermalink,
    summary: "Collection 1 summary",
    title: "Collection 1",
  }

  it("should return `null` when collectionId does not match any siteMap child", () => {
    // Arrange
    const nonExistentCollectionId = `${collectionId}9999999`
    const updatedSitemap = {
      ...site.siteMap,
      children: [collectionNode],
    }
    site = {
      ...site,
      siteMap: updatedSitemap,
      siteMapArray: [updatedSitemap, collectionNode],
    }

    // Act + Assert
    const actual = getCollectionParent({
      collectionId: nonExistentCollectionId,
      site,
    })

    expect(actual).toBeNull()
  })

  it("should return the collection node when collectionId matches a siteMap child", () => {
    // Arrange
    const updatedSitemap = {
      ...site.siteMap,
      children: [collectionNode],
    }
    site = {
      ...site,
      siteMap: updatedSitemap,
      siteMapArray: [updatedSitemap, collectionNode],
    }

    // Act
    const result = getCollectionParent({ collectionId, site })

    // Assert
    expect(result).toEqual(collectionNode)
  })

  it("should throw an error when siteMap has no children", () => {
    // Arrange
    const updatedSitemap = {
      ...site.siteMap,
      children: [],
    }
    site = {
      ...site,
      siteMap: updatedSitemap,
      siteMapArray: [],
    }

    // Act + Assert
    const actual = getCollectionParent({ collectionId, site })
    expect(actual).toBeNull()
  })

  it("should find the collection node even if nested", () => {
    // Arrange
    const nestedCollectionNode: IsomerSitemap = {
      children: [collectionNode],
      id: "nested-parent",
      lastModified: "2021-01-01",
      layout: "content",
      permalink: "/nested-parent",
      summary: "Nested parent summary",
      title: "Nested Parent",
    }
    const updatedSitemap = {
      ...site.siteMap,
      children: [nestedCollectionNode],
    }
    site = {
      ...site,
      siteMap: updatedSitemap,
      siteMapArray: [updatedSitemap, nestedCollectionNode, collectionNode],
    }

    // Act
    const result = getCollectionParent({ collectionId, site })

    // Assert
    expect(result).toEqual(collectionNode)
  })
})
