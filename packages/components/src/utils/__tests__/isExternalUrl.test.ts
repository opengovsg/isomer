import { describe, expect, it } from "vitest"

import { isExternalUrl } from "~/utils/isExternalUrl"

describe("isExternalUrl", () => {
  it("should return true for external URLs", () => {
    expect(isExternalUrl("https://example.com")).toBe(true)
    expect(isExternalUrl("http://example.com")).toBe(true)
  })

  it("should return false for internal URLs starting with '/'", () => {
    expect(isExternalUrl("/internal-page")).toBe(false)
  })

  it("should return false for URLs starting with '#'", () => {
    expect(isExternalUrl("#section")).toBe(false)
  })

  it("should return false for URLs starting with '[resource:'", () => {
    expect(isExternalUrl("[resource:some-resource]")).toBe(false)
  })

  it("should return false for undefined or empty string", () => {
    expect(isExternalUrl(undefined)).toBe(false)
    expect(isExternalUrl("")).toBe(false)
  })
})
