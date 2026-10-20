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

  it("should return false for mailto: links", () => {
    expect(isExternalUrl("mailto:test@example.com")).toBe(false)
  })

  it("should return false for tel: links", () => {
    expect(isExternalUrl("tel:+6512345678")).toBe(false)
  })

  it("should return false for mailto:/tel: links regardless of scheme casing", () => {
    expect(isExternalUrl("MAILTO:test@example.com")).toBe(false)
    expect(isExternalUrl("Mailto:test@example.com")).toBe(false)
    expect(isExternalUrl("TEL:+6512345678")).toBe(false)
    expect(isExternalUrl("Tel:+6512345678")).toBe(false)
  })
})
