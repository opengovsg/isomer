import type { IsomerSitemap } from "~/types"
import { describe, expect, it } from "vitest"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

import { getReferenceLinkHref } from "../getReferenceLinkHref"

const EXAMPLE_SITEMAP_ARRAY: IsomerSitemap[] = getSitemapAsArray({
  children: [
    {
      id: "2",
      lastModified: "",
      layout: "content",
      permalink: "/page-1",
      summary: "",
      title: "Page 1",
    },
  ],
  id: "1",
  lastModified: "",
  layout: "homepage",
  permalink: "/",
  summary: "",
  title: "Home",
})

describe("getReferenceLinkHref", () => {
  it("should return undefined if referenceLink is undefined", () => {
    const result = getReferenceLinkHref(
      undefined,
      EXAMPLE_SITEMAP_ARRAY,
      "https://assets.example.com",
    )
    expect(result).toBeUndefined()
  })

  it("should return original link if referenceLink is not a reference link", () => {
    const testCases = [
      "https://example.com",
      "https://example.com/page",
      "/page",
      "/page#section",
      "/page?query=string",
      "/2012/looks-like-asset-link",
    ]

    for (const testCase of testCases) {
      const result = getReferenceLinkHref(
        testCase,
        EXAMPLE_SITEMAP_ARRAY,
        "https://assets.example.com",
      )
      expect(result).toBe(testCase)
    }
  })

  it("should return permalink if referenceLink is a reference link", () => {
    const result = getReferenceLinkHref(
      "[resource:1:2]",
      EXAMPLE_SITEMAP_ARRAY,
      "https://assets.example.com",
    )
    expect(result).toBe("/page-1")
  })

  it("should return original link if reference page is not found", () => {
    const result = getReferenceLinkHref(
      "[resource:1:999]",
      EXAMPLE_SITEMAP_ARRAY,
      "https://assets.example.com",
    )
    expect(result).toBe("[resource:1:999]")
  })

  it("should return asset link if referenceLink is an asset link", () => {
    const result = getReferenceLinkHref(
      "/1/dc2b609a-355e-406c-af6c-003683731e7e/RFP%20Template.docx",
      EXAMPLE_SITEMAP_ARRAY,
      "https://assets.example.com",
    )
    expect(result).toBe(
      "https://assets.example.com/1/dc2b609a-355e-406c-af6c-003683731e7e/RFP%20Template.docx",
    )
  })

  it("should be able to handle unescaped quotes in reference link", () => {
    const unescapedLink = 'https://example.com/unescaped""quotes'

    const result = getReferenceLinkHref(
      unescapedLink,
      EXAMPLE_SITEMAP_ARRAY,
      "https://assets.example.com",
    )

    expect(result).toBe(unescapedLink)
  })
})
