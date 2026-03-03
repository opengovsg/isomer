import { describe, expect, it } from "vitest"

import { generateHttpsLink, HTTPS_PREFIX } from "../utils"

describe("generateHttpsLink", () => {
  it("returns normalised URL when input already starts with https://", () => {
    expect(generateHttpsLink("https://example.com")).toBe(
      "https://example.com/",
    )
    expect(generateHttpsLink("https://gov.sg/path")).toBe("https://gov.sg/path")
  })

  it("prepends https:// for plain host or path", () => {
    expect(generateHttpsLink("www.isomer.gov.sg")).toBe(
      "https://www.isomer.gov.sg/",
    )
    expect(generateHttpsLink("example.com")).toBe("https://example.com/")
  })

  it("normalises protocol-relative URLs to https (avoids open redirect)", () => {
    expect(generateHttpsLink("//example.com")).toBe("https://example.com/")
    expect(generateHttpsLink("//google.com")).toBe("https://google.com/")
    expect(generateHttpsLink("//malicious.com/path")).toBe(
      "https://malicious.com/path",
    )
  })

  it("coerces http to https", () => {
    expect(generateHttpsLink("http://example.com")).toBe("https://example.com/")
    expect(generateHttpsLink("http://gov.sg/page")).toBe("https://gov.sg/page")
  })

  it("trims leading and trailing whitespace", () => {
    expect(generateHttpsLink("  https://example.com  ")).toBe(
      "https://example.com/",
    )
    expect(generateHttpsLink("  www.example.com  ")).toBe(
      "https://www.example.com/",
    )
    expect(generateHttpsLink("  //example.com  ")).toBe("https://example.com/")
    expect(generateHttpsLink("  http://example.com  ")).toBe(
      "https://example.com/",
    )
  })

  it("preserves query string and hash", () => {
    expect(generateHttpsLink("https://example.com?q=1")).toBe(
      "https://example.com/?q=1",
    )
    expect(generateHttpsLink("http://gov.sg/page#section")).toBe(
      "https://gov.sg/page#section",
    )
  })

  it("does not produce double-slash hrefs for protocol-relative input", () => {
    expect(generateHttpsLink("//evil.com")).toBe("https://evil.com/")
  })

  it("collapses multiple leading slashes to single protocol-relative (//)", () => {
    expect(generateHttpsLink("/////////evil.com")).toBe("https://evil.com/")
    expect(generateHttpsLink("///example.com/path")).toBe(
      "https://example.com/path",
    )
  })

  it("falls back to candidate string when URL parse fails", () => {
    // Invalid URL: parse fails, we return the string we would have built
    expect(generateHttpsLink("https://")).toBe("https://")
    expect(generateHttpsLink("")).toBe("https://")
    expect(generateHttpsLink("   ")).toBe("https://")
  })
})

describe("HTTPS_PREFIX", () => {
  it("is https://", () => {
    expect(HTTPS_PREFIX).toBe("https://")
  })
})
