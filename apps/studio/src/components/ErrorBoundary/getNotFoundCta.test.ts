import { describe, expect, it } from "vitest"

import { getNotFoundCta, getNotFoundCtaFromPath } from "./getNotFoundCta"

const ALL_SITES = { href: "/", label: "Back to all sites" }
const YOUR_SITE = { href: "/sites/1", label: "Back to your site" }

describe("getNotFoundCta", () => {
  it("should link to the site when the route has a siteId", () => {
    expect(getNotFoundCta("/sites/[siteId]/pages/[pageId]", "1")).toEqual(
      YOUR_SITE,
    )
  })

  it("should link to all sites when the route has no siteId", () => {
    expect(getNotFoundCta("/", undefined)).toEqual(ALL_SITES)
  })

  it("should link to all sites when the failing route is the site dashboard itself", () => {
    // getRootPage throws NOT_FOUND on /sites/[siteId] with no RootPage row.
    expect(getNotFoundCta("/sites/[siteId]", "1")).toEqual(ALL_SITES)
  })

  it("should link to all sites when siteId is a repeated route param", () => {
    expect(
      getNotFoundCta("/sites/[siteId]/pages/[pageId]", ["1", "2"]),
    ).toEqual(ALL_SITES)
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
    expect(getNotFoundCtaFromPath(path)).toEqual(YOUR_SITE)
  })

  it("should canonicalise a zero-padded siteId", () => {
    expect(getNotFoundCtaFromPath("/sites/007/pages")).toEqual({
      href: "/sites/7",
      label: "Back to your site",
    })
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
    expect(getNotFoundCtaFromPath(path)).toEqual(ALL_SITES)
  })
})
