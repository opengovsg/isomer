import type { IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"

import { getSiderailFromSiteMap } from "../getSiderailFromSiteMap"

describe("getSiderailFromSiteMap", () => {
  it("excludes link layouts, including file URLs, from the siderail", () => {
    // Arrange
    const sitemap: IsomerSitemap = {
      id: "root",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          id: "collection",
          title: "Collection",
          permalink: "/collection",
          lastModified: "",
          layout: "collection",
          summary: "",
          children: [
            {
              id: "page",
              title: "Page",
              permalink: "/collection/page",
              lastModified: "",
              layout: "article",
              summary: "",
            },
            {
              id: "file",
              title: "File",
              permalink: "/collection/file",
              lastModified: "",
              layout: "link",
              summary: "",
              ref: "file.pdf",
            },
            {
              id: "link",
              title: "Link",
              permalink: "/collection/link",
              lastModified: "",
              layout: "link",
              summary: "",
              ref: "https://example.com",
            },
          ],
        },
      ],
    }

    // Act
    const result = getSiderailFromSiteMap(sitemap, "/collection/page")

    // Assert
    expect(result).toEqual({
      parentTitle: "Collection",
      parentUrl: "/collection",
      pages: [
        {
          title: "Page",
          url: "/collection/page",
          isCurrent: true,
        },
      ],
    })
  })
})
