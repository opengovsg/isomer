import { describe, expect, it } from "vitest"
import { isExternalUrl } from "~/utils/isExternalUrl"

describe(isExternalUrl, () => {
  it("should return true for external URLs", () => {
    expect(isExternalUrl("https://example.com")).toBeTruthy()
    expect(isExternalUrl("http://example.com")).toBeTruthy()
  })

  it("should return false for internal URLs starting with '/'", () => {
    expect(isExternalUrl("/internal-page")).toBeFalsy()
  })

  it("should return false for URLs starting with '#'", () => {
    expect(isExternalUrl("#section")).toBeFalsy()
  })

  it("should return false for URLs starting with '[resource:'", () => {
    expect(isExternalUrl("[resource:some-resource]")).toBeFalsy()
  })

  it("should return false for undefined or empty string", () => {
    expect(isExternalUrl(undefined)).toBeFalsy()
    expect(isExternalUrl("")).toBeFalsy()
  })
})
