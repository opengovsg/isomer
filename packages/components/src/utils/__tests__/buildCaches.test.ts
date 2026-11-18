import type { IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"

import { getSitemapAsArray } from "../getSitemapAsArray"

describe("getSitemapAsArray", () => {
  it("reuses the flattened array for the same sitemap object", () => {
    // Arrange
    const sitemap: IsomerSitemap = {
      id: "1",
      title: "Home",
      permalink: "/",
      lastModified: "",
      layout: "homepage",
      summary: "",
      children: [
        {
          id: "2",
          title: "About",
          permalink: "/about",
          lastModified: "",
          layout: "content",
          summary: "",
        },
      ],
    }

    // Act
    const first = getSitemapAsArray(sitemap)
    const second = getSitemapAsArray(sitemap)

    // Assert
    expect(second).toBe(first)
  })
})
