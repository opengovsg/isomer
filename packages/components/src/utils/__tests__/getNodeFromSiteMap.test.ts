import { describe, expect, it } from "vitest"

import type { IsomerSitemap } from "~/types"
import { getNodeFromSiteMap } from "../getNodeFromSiteMap"

const DEFAULT_SITEMAP: IsomerSitemap = {
  id: "1",
  title: "Isomer Next",
  permalink: "/",
  lastModified: "",
  layout: "homepage",
  summary: "",
  children: [
    {
      id: "2",
      title: "Parent page",
      permalink: "/parent",
      lastModified: "",
      layout: "content",
      summary: "",
      children: [
        {
          id: "3",
          title: "Irrationality",
          permalink: "/parent/rationality",
          lastModified: "",
          layout: "content",
          summary: "Pages in Irrationality",
          children: [
            {
              id: "4",
              title: "For Individuals",
              permalink: "/parent/rationality/child-page-1",
              lastModified: "",
              layout: "content",
              summary: "",
            },
            {
              id: "5",
              title: "Steven Pinker's Rationality",
              permalink: "/parent/rationality/child-page-2",
              lastModified: "",
              layout: "content",
              summary: "",
            },
          ],
        },
        {
          id: "6",
          title: "Sibling",
          permalink: "/parent/sibling",
          lastModified: "",
          layout: "content",
          summary: "Pages in Sibling",
          children: [
            {
              id: "7",
              title: "Child that should not appear",
              permalink: "/parent/sibling/child-page-2",
              lastModified: "",
              layout: "content",
              summary: "",
            },
          ],
        },
      ],
    },
    {
      id: "8",
      title: "Aunt/Uncle that should not appear",
      permalink: "/aunt-uncle",
      lastModified: "",
      layout: "content",
      summary: "",
    },
  ],
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
      title: "For Individuals",
      permalink: "/parent/rationality/child-page-1",
      lastModified: "",
      layout: "content",
      summary: "",
    })
  })

  it("should give the correct intermediate node if permalink is a page with children", () => {
    // Arrange
    const permalink = "/parent/rationality"

    // Act
    const result = getNodeFromSiteMap(DEFAULT_SITEMAP, permalink)

    // Assert
    expect(result).toStrictEqual({
      id: "3",
      title: "Irrationality",
      permalink: "/parent/rationality",
      lastModified: "",
      layout: "content",
      summary: "Pages in Irrationality",
      children: [
        {
          id: "4",
          title: "For Individuals",
          permalink: "/parent/rationality/child-page-1",
          lastModified: "",
          layout: "content",
          summary: "",
        },
        {
          id: "5",
          title: "Steven Pinker's Rationality",
          permalink: "/parent/rationality/child-page-2",
          lastModified: "",
          layout: "content",
          summary: "",
        },
      ],
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
