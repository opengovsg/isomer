import type { IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"

import { getNodeFromSiteMap } from "../getNodeFromSiteMap"

const DEFAULT_SITEMAP: IsomerSitemap = {
  children: [
    {
      children: [
        {
          children: [
            {
              id: "4",
              lastModified: "",
              layout: "content",
              permalink: "/parent/rationality/child-page-1",
              summary: "",
              title: "For Individuals",
            },
            {
              id: "5",
              lastModified: "",
              layout: "content",
              permalink: "/parent/rationality/child-page-2",
              summary: "",
              title: "Steven Pinker's Rationality",
            },
          ],
          id: "3",
          lastModified: "",
          layout: "content",
          permalink: "/parent/rationality",
          summary: "Pages in Irrationality",
          title: "Irrationality",
        },
        {
          children: [
            {
              id: "7",
              lastModified: "",
              layout: "content",
              permalink: "/parent/sibling/child-page-2",
              summary: "",
              title: "Child that should not appear",
            },
          ],
          id: "6",
          lastModified: "",
          layout: "content",
          permalink: "/parent/sibling",
          summary: "Pages in Sibling",
          title: "Sibling",
        },
      ],
      id: "2",
      lastModified: "",
      layout: "content",
      permalink: "/parent",
      summary: "",
      title: "Parent page",
    },
    {
      id: "8",
      lastModified: "",
      layout: "content",
      permalink: "/aunt-uncle",
      summary: "",
      title: "Aunt/Uncle that should not appear",
    },
  ],
  id: "1",
  lastModified: "",
  layout: "homepage",
  permalink: "/",
  summary: "",
  title: "Isomer Next",
}

describe("getNodeFromSiteMap", () => {
  it("should give the correct leaf node if permalink is a page with no children", () => {
    // Arrange
    const permalink = "/parent/rationality/child-page-1"

    // Act
    const result = getNodeFromSiteMap(DEFAULT_SITEMAP, permalink)

    // Assert
    expect(result).toStrictEqual({
      id: "4",
      lastModified: "",
      layout: "content",
      permalink: "/parent/rationality/child-page-1",
      summary: "",
      title: "For Individuals",
    })
  })

  it("should give the correct intermediate node if permalink is a page with children", () => {
    // Arrange
    const permalink = "/parent/rationality"

    // Act
    const result = getNodeFromSiteMap(DEFAULT_SITEMAP, permalink)

    // Assert
    expect(result).toStrictEqual({
      children: [
        {
          id: "4",
          lastModified: "",
          layout: "content",
          permalink: "/parent/rationality/child-page-1",
          summary: "",
          title: "For Individuals",
        },
        {
          id: "5",
          lastModified: "",
          layout: "content",
          permalink: "/parent/rationality/child-page-2",
          summary: "",
          title: "Steven Pinker's Rationality",
        },
      ],
      id: "3",
      lastModified: "",
      layout: "content",
      permalink: "/parent/rationality",
      summary: "Pages in Irrationality",
      title: "Irrationality",
    })
  })

  it("should give the root node if permalink is the root page", () => {
    // Arrange
    const permalink = "/"

    // Act
    const result = getNodeFromSiteMap(DEFAULT_SITEMAP, permalink)

    // Assert
    expect(result).toStrictEqual(DEFAULT_SITEMAP)
  })

  it("should return null if the permalink does not exist in the sitemap", () => {
    // Arrange
    const permalink = "/non-existent/page"

    // Act
    const result = getNodeFromSiteMap(DEFAULT_SITEMAP, permalink)

    // Assert
    expect(result).toBeNull()
  })
})
