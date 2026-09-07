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
    // Arrange: page.getRootPage and resource.getChildrenOf both throw
    // NOT_FOUND from /sites/[siteId], so linking back there would loop the
    // user onto the screen that just failed.

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
    ["/sites/1", "the site dashboard"],
    ["/sites/1/pages", "a truncated resource URL"],
    ["/sites/1/settings/colors", "a mistyped settings route"],
    ["/sites/1/pages/2/preview", "an over-deep route"],
    ["/sites/1?tab=drafts", "a query string"],
    ["/sites/1#anchor", "a hash"],
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
    ["/", "the root"],
    ["/404", "the 404 route itself"],
    ["/godmode/typo", "a non-site route"],
    ["/sites", "no id segment at all"],
    ["/sites/", "a trailing slash and no id"],
    ["/sites/abc/pages", "a non-numeric id"],
    ["/sites/12abc", "an id with trailing characters"],
    ["/sites/0/pages", "a zero id, which no site has"],
    ["/sites/-1/pages", "a negative id"],
    ["/sites/1.5/pages", "a non-integer id"],
    ["/Sites/1", "the wrong case, which is why it 404d"],
  ])("should link to all sites for %s (%s)", (path) => {
    // Act
    const result = getNotFoundCtaFromPath(path)

    // Assert
    expect(result).toEqual(ALL_SITES)
  })
})
