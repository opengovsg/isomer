import { describe, expect, it } from "vitest"

import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import { getCollectionParent } from "../getCollectionParent"

describe("getCollectionParent", () => {
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
    navBarItems: [], // Provide minimal valid value
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

  const collectionNode: IsomerSitemap = {
    id: collectionId,
    title: "Collection 1",
    permalink: collectionPermalink,
    layout: "collection",
    summary: "Collection 1 summary",
    lastModified: new Date("2021-01-01").toISOString(),
    children: [],
  }

  it("should throw an error when collectionId does not match any siteMap child", () => {
    // Arrange
    const nonExistentCollectionId = `${collectionId}9999999`
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionNode],
      },
    }

    // Act + Assert
    expect(() =>
      getCollectionParent({
        site,
        collectionId: nonExistentCollectionId,
      }),
    ).toThrow()
  })

  it("should return the collection node when collectionId matches a siteMap child", () => {
    // Arrange
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [collectionNode],
      },
    }

    // Act
    const result = getCollectionParent({ site, collectionId })

    // Assert
    expect(result).toEqual(collectionNode)
  })

  it("should throw an error when siteMap has no children", () => {
    // Arrange
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [],
      },
    }

    // Act + Assert
    expect(() => getCollectionParent({ site, collectionId })).toThrow()
  })

  it("should find the collection node even if nested", () => {
    // Arrange
    const nestedCollectionNode: IsomerSitemap = {
      id: "nested-parent",
      title: "Nested Parent",
      permalink: "/nested-parent",
      layout: "content",
      summary: "Nested parent summary",
      lastModified: "2021-01-01",
      children: [collectionNode],
    }
    site = {
      ...site,
      siteMap: {
        ...site.siteMap,
        children: [nestedCollectionNode],
      },
    }

    // Act
    const result = getCollectionParent({ site, collectionId })

    // Assert
    expect(result).toEqual(collectionNode)
  })
})
