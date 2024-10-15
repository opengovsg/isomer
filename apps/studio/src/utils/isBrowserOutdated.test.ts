import { isBrowserOutdated } from "./isBrowserOutdated"

describe("isBrowserOutdated", () => {
  it("should identify Chrome 63 as outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36"
    expect(isBrowserOutdated({ userAgent })).toBe(true)
  })

  it("should identify Chrome 64 as not outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"
    expect(isBrowserOutdated({ userAgent })).toBe(false)
  })

  it("should identify Edge 78 as outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/78.0.276.51 Safari/537.36"
    expect(isBrowserOutdated({ userAgent })).toBe(true)
  })

  it("should identify Edge 79 as not outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/79.0.309.65 Safari/537.36"
    expect(isBrowserOutdated({ userAgent })).toBe(false)
  })

  it("should identify Firefox 66 as outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0"
    expect(isBrowserOutdated({ userAgent })).toBe(true)
  })

  it("should identify Firefox 67 as not outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0"
    expect(isBrowserOutdated({ userAgent })).toBe(false)
  })

  it("should identify Opera 50 as outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 OPR/50.0.2762.67"
    expect(isBrowserOutdated({ userAgent })).toBe(true)
  })

  it("should identify Opera 51 as not outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 OPR/51.0.2830.40"
    expect(isBrowserOutdated({ userAgent })).toBe(false)
  })

  it("should identify Safari 11.1.2 as outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15"
    expect(isBrowserOutdated({ userAgent })).toBe(true)
  })

  it("should identify Safari 12.0.0 as not outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0.0 Safari/605.1.15"
    expect(isBrowserOutdated({ userAgent })).toBe(false)
  })

  it("should identify IE 11 as outdated", () => {
    const userAgent =
      "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko"
    expect(isBrowserOutdated({ userAgent })).toBe(true)
  })

  it("should return false for unknown browsers", () => {
    const unknownUserAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) UnknownBrowser/1.0"
    expect(isBrowserOutdated({ userAgent: unknownUserAgent })).toBe(false)
  })
})
