import type { IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"

import { resetBuildCachesForTests } from "../buildCacheReset"
import { getSanitizedLinkHref } from "../getReferenceLinkHref"
import { getSanitizedIframeWithTitle } from "../getSanitizedIframeWithTitle"
import { getSitemapAsArray } from "../getSitemapAsArray"

describe("build caches", () => {
  it("reuses flattened sitemap arrays for the same tree reference", () => {
    resetBuildCachesForTests()
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

    const first = getSitemapAsArray(sitemap)
    const second = getSitemapAsArray(sitemap)

    expect(second).toBe(first)
  })

  it("memoizes sanitized hrefs", () => {
    resetBuildCachesForTests()
    const url = "https://www.isomer.gov.sg"

    expect(getSanitizedLinkHref(url)).toBe(url)
    expect(getSanitizedLinkHref(url)).toBe(url)
  })

  it("clones cached iframe markup so titles stay independent", () => {
    resetBuildCachesForTests()
    const content =
      '<iframe src="https://example.com" width="1" height="1"></iframe>'

    const a = getSanitizedIframeWithTitle(content, "Title A")
    const b = getSanitizedIframeWithTitle(content, "Title B")

    expect(a?.getAttribute("title")).toBe("Title A")
    expect(b?.getAttribute("title")).toBe("Title B")
    expect(a).not.toBe(b)
  })
})
