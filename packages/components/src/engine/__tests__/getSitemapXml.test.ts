import type { IsomerSitemap } from "~/types/sitemap"
import { describe, expect, it } from "vitest"

import { getLastModifiedFromSitemap, getSitemapXml } from "../metadata"

const SITEMAP: IsomerSitemap = {
  id: "1",
  title: "Home",
  summary: "",
  lastModified: "2024-01-01T00:00:00.000Z",
  permalink: "/",
  layout: "homepage",
  children: [
    {
      id: "2",
      title: "About",
      summary: "",
      lastModified: "2024-02-02T00:00:00.000Z",
      permalink: "/about",
      layout: "content",
    },
    {
      id: "3",
      title: "External",
      summary: "",
      lastModified: "2024-03-03T00:00:00.000Z",
      permalink: "/gone",
      layout: "link",
      ref: "https://www.gov.sg",
    },
    {
      id: "4",
      title: "Nested",
      summary: "",
      lastModified: "2024-04-04T00:00:00.000Z",
      permalink: "/about/team",
      layout: "content",
    },
  ],
}

describe("getSitemapXml", () => {
  it("omits link-layout pages and adds trailing slashes", () => {
    // Arrange / Act
    const result = getSitemapXml(SITEMAP)

    // Assert
    expect(result).toEqual([
      { url: "/", lastModified: "2024-01-01T00:00:00.000Z" },
      { url: "/about/", lastModified: "2024-02-02T00:00:00.000Z" },
      { url: "/about/team/", lastModified: "2024-04-04T00:00:00.000Z" },
    ])
  })

  it("prefixes the site URL when provided", () => {
    // Arrange / Act
    const result = getSitemapXml(SITEMAP, "https://www.isomer.gov.sg")

    // Assert
    expect(result).toEqual([
      {
        url: "https://www.isomer.gov.sg/",
        lastModified: "2024-01-01T00:00:00.000Z",
      },
      {
        url: "https://www.isomer.gov.sg/about/",
        lastModified: "2024-02-02T00:00:00.000Z",
      },
      {
        url: "https://www.isomer.gov.sg/about/team/",
        lastModified: "2024-04-04T00:00:00.000Z",
      },
    ])
  })

  it("returns the same array for the same sitemap and site URL", () => {
    // Arrange / Act
    const first = getSitemapXml(SITEMAP)
    const second = getSitemapXml(SITEMAP)

    // Assert
    expect(second).toBe(first)
  })
})

describe("getLastModifiedFromSitemap", () => {
  it("looks up lastModified by permalink with or without slashes", () => {
    // Arrange / Act / Assert
    expect(getLastModifiedFromSitemap(SITEMAP, "")).toBe(
      "2024-01-01T00:00:00.000Z",
    )
    expect(getLastModifiedFromSitemap(SITEMAP, "/")).toBe(
      "2024-01-01T00:00:00.000Z",
    )
    expect(getLastModifiedFromSitemap(SITEMAP, "about")).toBe(
      "2024-02-02T00:00:00.000Z",
    )
    expect(getLastModifiedFromSitemap(SITEMAP, "/about/")).toBe(
      "2024-02-02T00:00:00.000Z",
    )
    expect(getLastModifiedFromSitemap(SITEMAP, "about/team")).toBe(
      "2024-04-04T00:00:00.000Z",
    )
  })

  it("returns undefined for link-layout and missing permalinks", () => {
    // Arrange / Act / Assert
    expect(getLastModifiedFromSitemap(SITEMAP, "gone")).toBeUndefined()
    expect(getLastModifiedFromSitemap(SITEMAP, "missing")).toBeUndefined()
  })
})
