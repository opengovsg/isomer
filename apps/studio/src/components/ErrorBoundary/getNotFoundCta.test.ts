import { describe, expect, it } from "vitest"

import { getNotFoundCta, getNotFoundCtaFromPath } from "./getNotFoundCta"

const ALL_SITES = { href: "/", label: "Back to all sites" }
const YOUR_SITE = { href: "/sites/1", label: "Back to your site" }

describe("getNotFoundCta", () => {
  it("should link to the site when the route has a siteId", () => {
    // Act
    const result = getNotFoundCta("/sites/[siteId]/pages/[pageId]", "1")

    // Assert
    expect(result).toEqual(YOUR_SITE)
  })

  it("should link to all sites when the route has no siteId", () => {
    // Act
    const result = getNotFoundCta("/", undefined)

    // Assert
    expect(result).toEqual(ALL_SITES)
  })

  it("should link to all sites when the failing route is the site dashboard itself", () => {
    // Arrange: getRootPage throws NOT_FOUND on /sites/[siteId] with no RootPage row.

    // Act
    const result = getNotFoundCta("/sites/[siteId]", "1")

    // Assert
    expect(result).toEqual(ALL_SITES)
  })

  it("should link to all sites when siteId is a repeated route param", () => {
    // Act
    const result = getNotFoundCta("/sites/[siteId]/pages/[pageId]", ["1", "2"])

    // Assert
    expect(result).toEqual(ALL_SITES)
  })
})

describe("getNotFoundCtaFromPath", () => {
  it.each([
    ["/sites/1", "site dashboard"],
    ["/sites/1/pages", "truncated URL"],
    ["/sites/1/settings/colors", "settings typo"],
    ["/sites/1/pages/2/preview", "extra path segment"],
    ["/sites/1?tab=drafts", "query string"],
    ["/sites/1#anchor", "hash"],
  ])("should recover the siteId from %s (%s)", (path) => {
    // Act
    const result = getNotFoundCtaFromPath(path)

    // Assert
    expect(result).toEqual(YOUR_SITE)
  })

  it("should canonicalise a zero-padded siteId", () => {
    // Act
    const result = getNotFoundCtaFromPath("/sites/007/pages")

    // Assert
    expect(result).toEqual({ href: "/sites/7", label: "Back to your site" })
  })

  it.each([
    ["/", "root"],
    ["/404", "404 route"],
    ["/godmode/typo", "non-site route"],
    ["/sites", "missing id"],
    ["/sites/", "trailing slash only"],
    ["/sites/abc/pages", "non-numeric id"],
    ["/sites/12abc", "id with suffix"],
    ["/sites/0/pages", "zero id"],
    ["/sites/-1/pages", "negative id"],
    ["/sites/1.5/pages", "non-integer id"],
    ["/Sites/1", "wrong casing"],
  ])("should link to all sites for %s (%s)", (path) => {
    // Act
    const result = getNotFoundCtaFromPath(path)

    // Assert
    expect(result).toEqual(ALL_SITES)
  })
})
